import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { validateProfile } from "@/lib/validation/profile";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validateProfile(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", parsed.data.telegramId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { interests, photoPaths, ownershipConfirmed: _ownershipConfirmed, telegramId, firstName, lookingForGender, heightCm, ...profile } = parsed.data;
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: firstName,
        looking_for_gender: lookingForGender,
        height_cm: heightCm,
        status: "pending",
        ...profile
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("photos").delete().eq("profile_id", data.id);
  const { error: photoError } = await supabase.from("photos").insert(
    photoPaths.map((path, index) => ({
      profile_id: data.id,
      storage_path: path,
      is_primary: index === 0,
      face_detected: null,
      single_person: null,
      is_appropriate: null,
      moderation_status: "pending"
    }))
  );

  if (photoError) {
    return NextResponse.json({ error: photoError.message }, { status: 500 });
  }

  if (interests.length > 0) {
    const interestRows = interests.map((name) => ({
      name_uz: name,
      slug: name.toLowerCase().replaceAll("'", "").replaceAll(" ", "-")
    }));
    await supabase.from("interests").upsert(interestRows, { onConflict: "slug" });
    const { data: savedInterests } = await supabase.from("interests").select("id, slug").in("slug", interestRows.map((item) => item.slug));
    if (savedInterests?.length) {
      await supabase.from("profile_interests").delete().eq("profile_id", data.id);
      await supabase.from("profile_interests").insert(savedInterests.map((item) => ({ profile_id: data.id, interest_id: item.id })));
    }
  }

  await supabase.from("audit_logs").insert({
    event: "new_profile",
    subject_user_id: user.id,
    profile_id: data.id,
    telegram_user_id: telegramId,
    metadata: { photo_count: photoPaths.length, ownership_confirmed: true }
  });

  return NextResponse.json({ ok: true, status: "pending", profile: data, photoCount: photoPaths.length });
}

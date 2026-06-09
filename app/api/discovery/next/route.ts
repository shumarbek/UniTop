import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const telegramId = Number(new URL(request.url).searchParams.get("telegramId"));
  if (!telegramId) return NextResponse.json({ error: "telegramId kerak" }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const { data: user } = await supabase.from("users").select("id, is_banned").eq("telegram_id", telegramId).single();
  if (!user || user.is_banned) return NextResponse.json({ error: "user_not_allowed" }, { status: 403 });

  const { data: viewer } = await supabase
    .from("profiles")
    .select("id, age, gender, looking_for_gender, region, district, city, university, status")
    .eq("user_id", user.id)
    .single();

  if (!viewer || viewer.status !== "approved") {
    return NextResponse.json({ ok: true, candidate: null, reason: "profile_not_approved" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .gt("ends_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  const dailyLimit = subscription ? 400 : 100;

  const { data: usage } = await supabase
    .from("daily_usage")
    .select("profile_views, referral_extra_views")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  const used = usage?.profile_views ?? 0;
  const extra = usage?.referral_extra_views ?? 0;
  if (used >= dailyLimit + extra) {
    return NextResponse.json({ ok: true, candidate: null, dailyLimit, remaining: 0, reason: "daily_limit_reached" });
  }

  const { data: likedRows } = await supabase.from("likes").select("target_profile_id").eq("actor_profile_id", viewer.id);
  const excluded = new Set([viewer.id, ...(likedRows ?? []).map((row) => row.target_profile_id as string)]);
  const { data: candidates, error } = await supabase
    .from("profiles")
    .select("id, display_name, age, gender, region, district, city, bio, purpose, university, photos(storage_path, is_primary, moderation_status)")
    .eq("status", "approved")
    .eq("gender", viewer.looking_for_gender)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const candidate = (candidates ?? [])
    .filter((item) => !excluded.has(item.id))
    .sort((a, b) => scoreCandidate(b, viewer) - scoreCandidate(a, viewer))[0] ?? null;

  let enrichedCandidate = candidate as any;
  if (candidate) {
    await supabase.from("daily_usage").upsert({
      user_id: user.id,
      usage_date: today,
      profile_views: used + 1,
      referral_extra_views: extra
    });
    const primaryPhoto = (candidate.photos ?? []).find((photo: any) => photo.is_primary) ?? candidate.photos?.[0];
    if (primaryPhoto?.storage_path) {
      const { data: signed } = await supabase.storage
        .from(process.env.SUPABASE_PROFILE_PHOTOS_BUCKET ?? "profile-photos")
        .createSignedUrl(primaryPhoto.storage_path, 60 * 15);
      enrichedCandidate = { ...candidate, photoUrl: signed?.signedUrl ?? null };
    }
  }

  return NextResponse.json({
    ok: true,
    dailyLimit,
    remaining: Math.max(0, dailyLimit + extra - used - (candidate ? 1 : 0)),
    candidate: enrichedCandidate
  });
}

function scoreCandidate(candidate: any, viewer: any) {
  let score = 0;
  if (candidate.district === viewer.district) score += 50;
  if (candidate.city && candidate.city === viewer.city) score += 35;
  if (candidate.region === viewer.region) score += 25;
  score += Math.max(0, 20 - Math.abs(Number(candidate.age) - Number(viewer.age)));
  if (candidate.university && candidate.university === viewer.university) score += 10;
  return score;
}

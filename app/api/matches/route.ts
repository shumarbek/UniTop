import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const telegramId = Number(new URL(request.url).searchParams.get("telegramId"));
  if (!telegramId) return NextResponse.json({ error: "telegramId kerak" }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const { data: user } = await supabase.from("users").select("id").eq("telegram_id", telegramId).single();
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return NextResponse.json({ ok: true, matches: [] });

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, profile_a_id, profile_b_id, matched_at, unmatched_at")
    .or(`profile_a_id.eq.${profile.id},profile_b_id.eq.${profile.id}`)
    .is("unmatched_at", null)
    .order("matched_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const otherIds = (matches ?? []).map((match) => match.profile_a_id === profile.id ? match.profile_b_id : match.profile_a_id);
  const { data: profiles } = otherIds.length
    ? await supabase.from("profiles").select("id, display_name, age, region, district, bio, photos(storage_path, is_primary)").in("id", otherIds)
    : { data: [] };

  return NextResponse.json({
    ok: true,
    matches: (matches ?? []).map((match) => ({
      ...match,
      profile: profiles?.find((item) => item.id === (match.profile_a_id === profile.id ? match.profile_b_id : match.profile_a_id)) ?? null
    }))
  });
}

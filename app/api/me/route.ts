import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const telegramId = Number(new URL(request.url).searchParams.get("telegramId"));
  if (!telegramId) {
    return NextResponse.json({ error: "telegramId kerak" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      user: { telegram_id: telegramId, terms_accepted_at: null, channel_checked_at: null },
      profile: { status: "pending" },
      premium: { active: false, dailyLimit: 100 }
    });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, telegram_id, first_name, is_admin, is_banned, terms_accepted_at, channel_checked_at, profiles(status, display_name)")
    .eq("telegram_id", telegramId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("ends_at")
    .eq("user_id", user.id)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    user,
    premium: { active: Boolean(subscription), dailyLimit: subscription ? 400 : 100, endsAt: subscription?.ends_at ?? null }
  });
}

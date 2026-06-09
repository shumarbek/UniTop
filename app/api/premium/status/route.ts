import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const telegramId = Number(new URL(request.url).searchParams.get("telegramId"));
  if (!telegramId) return NextResponse.json({ error: "telegramId kerak" }, { status: 400 });

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  const { data: user } = await supabase.from("users").select("id").eq("telegram_id", telegramId).single();
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_days, ends_at")
    .eq("user_id", user.id)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    active: Boolean(subscription),
    dailyLimit: subscription ? 400 : 100,
    subscription,
    plans: [
      { days: 7, price: 19000, currency: "UZS" },
      { days: 30, price: 59000, currency: "UZS" },
      { days: 90, price: 149000, currency: "UZS" }
    ]
  });
}

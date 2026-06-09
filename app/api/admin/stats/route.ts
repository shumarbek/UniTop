import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  const [users, activeProfiles, premium, matches, registrations, revenue] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).gt("ends_at", new Date().toISOString()),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00.000Z`),
    supabase.from("payments").select("amount").eq("status", "paid")
  ]);

  return NextResponse.json({
    totalUsers: users.count ?? 0,
    activeUsers: activeProfiles.count ?? 0,
    premiumUsers: premium.count ?? 0,
    matchesCreated: matches.count ?? 0,
    dailyRegistrations: registrations.count ?? 0,
    revenue: (revenue.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  });
}

import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { sendAuditEvent } from "@/lib/telegram/bot";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return markPaid(String(body.paymentId ?? ""));
}

export function GET(request: Request) {
  return markPaid(new URL(request.url).searchParams.get("paymentId") ?? "");
}

async function markPaid(paymentId: string) {
  if (!paymentId) return NextResponse.json({ error: "paymentId kerak" }, { status: 400 });
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const { data: payment, error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId)
    .select("id, user_id, amount, metadata")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const metadata = payment.metadata as { type?: string; planDays?: number; boostHours?: number; profileId?: string };
  if (metadata.type === "premium" && metadata.planDays) {
    const now = new Date();
    const ends = new Date(now.getTime() + Number(metadata.planDays) * 86400000);
    await supabase.from("subscriptions").insert({
      user_id: payment.user_id,
      plan_days: Number(metadata.planDays),
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
      source_payment_id: payment.id
    });
    await sendAuditEvent("premium_purchased", { user_id: payment.user_id, payment_id: payment.id, plan_days: metadata.planDays }).catch(() => null);
  }

  if (metadata.type === "boost" && metadata.boostHours && metadata.profileId) {
    const now = new Date();
    const ends = new Date(now.getTime() + Number(metadata.boostHours) * 3600000);
    await supabase.from("boosts").insert({
      profile_id: metadata.profileId,
      payment_id: payment.id,
      starts_at: now.toISOString(),
      ends_at: ends.toISOString()
    });
  }

  return NextResponse.json({ ok: true, paymentId, status: "paid", processedAt: new Date().toISOString() });
}

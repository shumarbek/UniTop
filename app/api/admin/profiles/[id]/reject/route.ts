import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { sendAuditEvent, sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const reason = body.reason ?? "Profil qoidalarga mos emas. Rasmlarda yuz aniq ko'rinishi va 3 ta rasm bo'lishi shart.";
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", params.id)
    .select("id, user_id, users(telegram_id)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("photos").update({ moderation_status: "rejected" }).eq("profile_id", params.id);
  await supabase.from("audit_logs").insert({ event: "profile_rejected", subject_user_id: profile.user_id, profile_id: params.id, metadata: { reason } });
  await sendAuditEvent("profile_rejected", { profile_id: params.id, reason, timestamp: new Date().toISOString() }).catch(() => null);
  const telegramId = Array.isArray(profile.users) ? profile.users[0]?.telegram_id : (profile.users as any)?.telegram_id;
  if (telegramId) await sendTelegramMessage({ chat_id: telegramId, text: `Profilingiz rad etildi: ${reason}` }).catch(() => null);

  return NextResponse.json({ ok: true, profileId: params.id, status: "rejected", reason });
}

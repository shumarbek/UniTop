import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { sendAuditEvent, sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ status: "approved", approved_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", params.id)
    .select("id, user_id, users(telegram_id)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("photos").update({ moderation_status: "approved", face_detected: true, single_person: true, is_appropriate: true }).eq("profile_id", params.id);
  await supabase.from("audit_logs").insert({ event: "profile_approved", subject_user_id: profile.user_id, profile_id: params.id });
  await sendAuditEvent("profile_approved", { profile_id: params.id, user_id: profile.user_id, timestamp: new Date().toISOString() }).catch(() => null);
  const telegramId = Array.isArray(profile.users) ? profile.users[0]?.telegram_id : (profile.users as any)?.telegram_id;
  if (telegramId) await sendTelegramMessage({ chat_id: telegramId, text: "Profilingiz tasdiqlandi. Endi UniTop discovery ishlaydi." }).catch(() => null);

  return NextResponse.json({ ok: true, profileId: params.id, status: "approved" });
}

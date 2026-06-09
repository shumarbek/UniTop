import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const telegramId = Number(body.telegramId);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_REQUIRED_CHANNEL;

  if (!telegramId) {
    return NextResponse.json({ error: "telegramId kerak" }, { status: 400 });
  }

  if (!token || !channel) {
    return NextResponse.json({ ok: true, mode: "demo", member: true });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: channel, user_id: telegramId })
  });
  const payload = await response.json();
  const status = payload?.result?.status;
  const member = ["creator", "administrator", "member"].includes(status);

  if (member) {
    const supabase = getServiceSupabase();
    await supabase?.from("users").update({ channel_checked_at: new Date().toISOString() }).eq("telegram_id", telegramId);
  }

  return NextResponse.json({ ok: true, member, status: status ?? "unknown" });
}

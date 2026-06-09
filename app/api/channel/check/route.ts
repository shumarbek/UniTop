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
    return NextResponse.json({ error: "Telegram bot token yoki kanal sozlanmagan." }, { status: 500 });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: channel, user_id: telegramId })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    return NextResponse.json(
      {
        ok: false,
        member: false,
        error: "Kanal tekshiruvi ishlamadi. Bot kanalga admin/member qilib qo'shilganini va TELEGRAM_REQUIRED_CHANNEL to'g'ri ekanini tekshiring.",
        description: payload.description ?? "Telegram API error"
      },
      { status: 502 }
    );
  }
  const status = payload?.result?.status;
  const member = ["creator", "administrator", "member"].includes(status);

  if (member) {
    const supabase = getServiceSupabase();
    const { error } = await supabase?.from("users").upsert(
      {
        telegram_id: telegramId,
        channel_checked_at: new Date().toISOString(),
        language_code: "uz"
      },
      { onConflict: "telegram_id" }
    ) ?? { error: null };
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    member,
    status: status ?? "unknown",
    error: member ? null : `Kanal statusi: ${status ?? "unknown"}. Obuna bo'lib qayta tekshiring.`
  });
}

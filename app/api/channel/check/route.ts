import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { normalizeTelegramChannel } from "@/lib/telegram/bot";

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

  const chatId = normalizeTelegramChannel(channel);
  const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, user_id: telegramId })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    return NextResponse.json(
      {
        ok: false,
        member: false,
        error: `Kanal tekshiruvi ishlamadi. Bot ${chatId} kanalga admin/member qilib qo'shilganini tekshiring.`,
        chatId,
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
    chatId,
    status: status ?? "unknown",
    error: member ? null : `Kanal statusi: ${status ?? "unknown"}. Obuna bo'lib qayta tekshiring.`
  });
}

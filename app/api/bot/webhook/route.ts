import { NextResponse } from "next/server";
import {
  answerCallbackQuery,
  buildWelcomeKeyboard,
  buildWelcomeMessage,
  parseStartPayload,
  sendAuditEvent,
  sendTelegramMessage,
  type TelegramUpdate
} from "@/lib/telegram/bot";
import { getServiceSupabase } from "@/lib/supabase/server";

export function GET() {
  return NextResponse.json({ ok: true, endpoint: "telegram_webhook" });
}

export async function POST(request: Request) {
  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;

  if (message?.text?.startsWith("/start")) {
    const referral = parseStartPayload(message.text);
    const from = message.from;
    const supabase = getServiceSupabase();

    if (from?.id && supabase) {
      await supabase.from("users").upsert(
        {
          telegram_id: from.id,
          first_name: from.first_name,
          last_name: from.last_name,
          username: from.username,
          language_code: "uz"
        },
        { onConflict: "telegram_id" }
      );
    }

    await sendTelegramMessage({
      chat_id: message.chat.id,
      parse_mode: "HTML",
      text: buildWelcomeMessage(from?.first_name),
      reply_markup: buildWelcomeKeyboard(referral ?? undefined)
    });

    await sendAuditEvent("bot_start", {
      telegram_user_id: from?.id ?? "unknown",
      referral: referral ?? "none",
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, action: "start_handled" });
  }

  const callback = update.callback_query;
  if (callback?.data === "check_channel") {
    await answerCallbackQuery(callback.id, "Mini App ichida obuna tekshiruvi ishga tushadi.");
    if (callback.message?.chat.id) {
      await sendTelegramMessage({
        chat_id: callback.message.chat.id,
        text: "Mini Appni oching va obuna tekshiruvini yakunlang.",
        reply_markup: buildWelcomeKeyboard()
      });
    }
    return NextResponse.json({ ok: true, action: "channel_check_prompt" });
  }

  return NextResponse.json({ ok: true, action: "ignored" });
}

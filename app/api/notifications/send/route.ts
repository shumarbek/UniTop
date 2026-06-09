import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.telegramId || !body.text) {
    return NextResponse.json({ error: "telegramId va text kerak" }, { status: 400 });
  }

  const result = await sendTelegramMessage({
    chat_id: Number(body.telegramId),
    text: String(body.text)
  });

  return NextResponse.json({ ok: true, result });
}

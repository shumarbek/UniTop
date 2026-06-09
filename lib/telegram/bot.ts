type InlineKeyboardButton = {
  text: string;
  url?: string;
  web_app?: { url: string };
  callback_data?: string;
};

type SendMessagePayload = {
  chat_id: number | string;
  text: string;
  parse_mode?: "HTML";
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
};

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  callback_query?: {
    id: string;
    data?: string;
    from: { id: number };
    message?: { chat: { id: number } };
  };
};

export function getMiniAppUrl(referralCode?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL(appUrl);
  if (referralCode) url.searchParams.set("ref", referralCode);
  return url.toString();
}

export function parseStartPayload(text?: string) {
  if (!text?.startsWith("/start")) return null;
  const [, payload] = text.trim().split(/\s+/, 2);
  return payload?.trim() || null;
}

export function buildWelcomeMessage(firstName = "do'stim") {
  return [
    `Assalomu alaykum, ${escapeHtml(firstName)}!`,
    "",
    "UniTop - O'zbekistondagi do'stlik, suhbat, o'qish, networking va munosabatlar uchun Telegram Mini App.",
    "",
    "Platforma hozir faqat o'zbek tilida ishlaydi. Davom etish uchun shartlarni qabul qiling va rasmiy kanalga obuna bo'ling."
  ].join("\n");
}

export function buildWelcomeKeyboard(referralCode?: string) {
  const channel = process.env.TELEGRAM_REQUIRED_CHANNEL ?? "@unitop_uz";
  return {
    inline_keyboard: [
      [{ text: "UniTop Mini App", web_app: { url: getMiniAppUrl(referralCode) } }],
      [{ text: "Rasmiy kanal", url: channel.startsWith("@") ? `https://t.me/${channel.slice(1)}` : String(channel) }],
      [{ text: "Obunani tekshirish", callback_data: "check_channel" }]
    ]
  };
}

export async function sendTelegramMessage(payload: SendMessagePayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: true, demo: true, payload };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.description ?? "Telegram sendMessage failed");
  }

  return data;
}

export async function answerCallbackQuery(callbackQueryId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: true, demo: true };

  const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false })
  });

  return response.json();
}

export async function sendAuditEvent(event: string, details: Record<string, unknown>) {
  const chatId = process.env.TELEGRAM_ADMIN_AUDIT_CHAT_ID;
  if (!chatId) return { ok: true, demo: true };

  const lines = Object.entries(details).map(([key, value]) => `<b>${escapeHtml(key)}:</b> ${escapeHtml(String(value))}`);
  return sendTelegramMessage({
    chat_id: chatId,
    parse_mode: "HTML",
    text: [`<b>UniTop audit:</b> ${escapeHtml(event)}`, ...lines].join("\n")
  });
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

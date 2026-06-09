import crypto from "crypto";

export function verifyTelegramInitData(initData: string, botToken = process.env.TELEGRAM_BOT_TOKEN) {
  if (!botToken) {
    return { ok: true, demo: true, user: { id: 100001, first_name: "Demo" } };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "hash_missing" };

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (expected.length !== hash.length) {
    return { ok: false, error: "invalid_hash" };
  }

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) {
    return { ok: false, error: "invalid_hash" };
  }

  const userRaw = params.get("user");
  try {
    return { ok: true, user: userRaw ? JSON.parse(userRaw) : null };
  } catch {
    return { ok: false, error: "invalid_user_payload" };
  }
}

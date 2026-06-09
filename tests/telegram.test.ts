import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { buildWelcomeKeyboard, buildWelcomeMessage, escapeHtml, getTelegramChannelUrl, normalizeTelegramChannel, parseStartPayload } from "@/lib/telegram/bot";
import { verifyTelegramInitData } from "@/lib/telegram/init-data";

function signInitData(data: Record<string, string>, botToken: string) {
  const params = new URLSearchParams(data);
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

describe("telegram bot helpers", () => {
  it("parses /start referral payload", () => {
    expect(parseStartPayload("/start abc123")).toBe("abc123");
    expect(parseStartPayload("/help")).toBeNull();
  });

  it("escapes HTML in bot messages", () => {
    expect(escapeHtml("<Ali&Vali>")).toBe("&lt;Ali&amp;Vali&gt;");
    expect(buildWelcomeMessage("<Ali>")).toContain("&lt;Ali&gt;");
  });

  it("builds mini app keyboard", () => {
    const keyboard = buildWelcomeKeyboard("ref-1");
    expect(keyboard.inline_keyboard[0][0].web_app?.url).toContain("ref=ref-1");
  });

  it("normalizes Telegram channel urls for Bot API", () => {
    expect(normalizeTelegramChannel("https://t.me/UniTop_rasmiy")).toBe("@UniTop_rasmiy");
    expect(normalizeTelegramChannel("t.me/UniTop_rasmiy")).toBe("@UniTop_rasmiy");
    expect(normalizeTelegramChannel("@UniTop_rasmiy")).toBe("@UniTop_rasmiy");
    expect(getTelegramChannelUrl("https://t.me/UniTop_rasmiy")).toBe("https://t.me/UniTop_rasmiy");
  });
});

describe("telegram init data verification", () => {
  it("accepts correctly signed init data", () => {
    const botToken = "123:test-token";
    const initData = signInitData(
      {
        auth_date: "1710000000",
        query_id: "q1",
        user: JSON.stringify({ id: 42, first_name: "Ali" })
      },
      botToken
    );

    const result = verifyTelegramInitData(initData, botToken);
    expect(result.ok).toBe(true);
    expect(result.user).toEqual({ id: 42, first_name: "Ali" });
  });

  it("rejects invalid hash", () => {
    const result = verifyTelegramInitData("hash=bad&user=%7B%7D", "123:test-token");
    expect(result.ok).toBe(false);
  });
});

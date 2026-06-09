import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN missing" }, { status: 500 });

  let app: Record<string, unknown>;
  try {
    const url = new URL(appUrl ?? "");
    app = {
      protocol: url.protocol,
      host: url.host,
      isHttps: url.protocol === "https:",
      isLocal: ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname),
      webhookUrl: `${url.origin}/api/bot/webhook`
    };
  } catch {
    app = { error: "NEXT_PUBLIC_APP_URL invalid" };
  }

  const [me, webhook] = await Promise.all([
    telegramGet("getMe", token),
    telegramGet("getWebhookInfo", token)
  ]);

  return NextResponse.json({
    ok: Boolean(me.ok && webhook.ok),
    app,
    bot: {
      ok: me.ok,
      username: me.result?.username ?? null,
      error: me.description ?? null
    },
    webhook: {
      ok: webhook.ok,
      url: webhook.result?.url ?? "",
      pendingUpdateCount: webhook.result?.pending_update_count ?? 0,
      lastErrorMessage: webhook.result?.last_error_message ?? null
    }
  });
}

async function telegramGet(method: string, token: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { cache: "no-store" });
    return response.json();
  } catch (error) {
    return { ok: false, description: error instanceof Error ? error.message : "fetch_failed" };
  }
}

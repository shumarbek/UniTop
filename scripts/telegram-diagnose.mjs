import { loadEnv, telegram } from "./env.mjs";

const env = loadEnv();
const token = env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN .env ichida yo'q.");

let app = null;
try {
  const url = new URL(env.NEXT_PUBLIC_APP_URL ?? "");
  app = {
    protocol: url.protocol,
    host: url.host,
    isHttps: url.protocol === "https:",
    isLocal: ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname),
    webhookUrl: `${url.origin}/api/bot/webhook`
  };
} catch {
  app = { error: "NEXT_PUBLIC_APP_URL noto'g'ri." };
}

const me = await telegram("getMe", {}, token);
const webhook = await telegram("getWebhookInfo", {}, token);
const menuButton = await telegram("getChatMenuButton", {}, token).catch((error) => ({ error: error.message }));

console.log(
  JSON.stringify(
    {
      bot: { id: me.id, username: me.username, can_join_groups: me.can_join_groups },
      app,
      webhook: {
        url: webhook.url,
        pending_update_count: webhook.pending_update_count,
        last_error_date: webhook.last_error_date,
        last_error_message: webhook.last_error_message
      },
      menuButton
    },
    null,
    2
  )
);

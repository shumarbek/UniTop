import { loadEnv, requirePublicHttpsAppUrl, telegram } from "./env.mjs";

const env = loadEnv();
const token = env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN .env ichida yo'q.");

const appUrl = requirePublicHttpsAppUrl(env);
const webhookUrl = `${appUrl.origin}/api/bot/webhook`;

await telegram(
  "setWebhook",
  {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false
  },
  token
);

await telegram(
  "setMyCommands",
  {
    commands: [
      { command: "start", description: "UniTop Mini Appni ochish" },
      { command: "support", description: "Yordam markazi" }
    ]
  },
  token
);

await telegram(
  "setChatMenuButton",
  {
    menu_button: {
      type: "web_app",
      text: "UniTop",
      web_app: { url: appUrl.toString() }
    }
  },
  token
);

const webhook = await telegram("getWebhookInfo", {}, token);
console.log(
  JSON.stringify(
    {
      ok: true,
      appUrl: appUrl.toString(),
      webhookUrl,
      telegramWebhook: {
        url: webhook.url,
        pending_update_count: webhook.pending_update_count,
        last_error_message: webhook.last_error_message
      }
    },
    null,
    2
  )
);

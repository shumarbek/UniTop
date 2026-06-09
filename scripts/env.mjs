import fs from "fs";

export function loadEnv() {
  const file = fs.existsSync(".env.local") ? ".env.local" : ".env";
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

export function requirePublicHttpsAppUrl(env) {
  const raw = env.NEXT_PUBLIC_APP_URL;
  if (!raw) throw new Error("NEXT_PUBLIC_APP_URL .env ichida yo'q.");
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("NEXT_PUBLIC_APP_URL HTTPS bo'lishi kerak. Telegram localhost/http URLni ochmaydi.");
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) {
    throw new Error("NEXT_PUBLIC_APP_URL public domen bo'lishi kerak, localhost emas.");
  }
  return url;
}

export async function telegram(method, payload, token) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {})
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`${method}: ${data.description ?? "Telegram API error"}`);
  return data.result;
}

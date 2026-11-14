// Points @gojoline_bot at the deployed app. Run once per deployment URL:
//   APP_URL=https://<your-app> node --experimental-strip-types scripts/telegram-webhook.mts
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET (the same secret as in the app's env).
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = process.env.APP_URL?.replace(/\/$/, "");
if (!token || !secret || secret.length < 16 || !appUrl?.startsWith("https://")) {
  console.error("Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET (16+ chars) and APP_URL (https).");
  process.exit(1);
}
const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: `${appUrl}/api/telegram/webhook`, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true }),
});
console.log(res.status, await res.text());

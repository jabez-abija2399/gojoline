import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { isUserVerified } from "@/lib/auth/verified";
import { handleUpdate } from "@/lib/telegram/bot";
import { services } from "@/lib/server/services";

export const maxDuration = 300;

function secretOk(given: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || expected.length < 16 || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Telegram webhook. Telegram sends our secret in X-Telegram-Bot-Api-Secret-Token; anything
 * without it is refused. We answer at once and do the work after the response (agent edits
 * take ~30 s); updates are handled once even if Telegram retries.
 */
export async function POST(request: Request) {
  if (!secretOk(request.headers.get("x-telegram-bot-api-secret-token"))) return new Response(null, { status: 401 });
  const svc = services();
  if (!svc.telegram) return new Response(null, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 1_000_000) return new Response(null, { status: 413 });
  const update = await request.json().catch(() => null);
  if (!update) return new Response(null, { status: 400 });
  const telegram = svc.telegram;
  after(async () => {
    try {
      await handleUpdate(
        { store: telegram.store, client: telegram.client, builder: svc.builder, publish: svc.publish, limiter: svc.rateLimiter, isVerified: isUserVerified },
        update,
      );
    } catch (error) {
      console.error("telegram update failed", error instanceof Error ? error.message : "unknown");
    }
  });
  return new Response(null, { status: 200 });
}

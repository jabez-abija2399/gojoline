import { timingSafeEqual } from "node:crypto";
import { reportError } from "@/lib/observability/report";
import { analytics, services } from "@/lib/server/services";
import { addDays } from "@/lib/posts/plan";
import { addisNow, runDue } from "@/lib/posts/service";
import { isDigestTime, weeklyDigest } from "@/lib/posts/digest";

export const maxDuration = 300;

/**
 * Every 15 minutes (deploy/server/gojoline-posts.timer): sends approved posts whose time has come
 * to Gojoline's channels, and on Monday morning the week's numbers to the founder's Telegram
 * (TELEGRAM_ADMIN_CHAT_ID). One run at a time.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || given.length !== want.length || !timingSafeEqual(given, want)) return new Response(null, { status: 401 });
  const svc = services();
  const lock = svc.builder?.lock;
  const token = lock ? await lock.acquire("posts:run", 280_000) : "none";
  if (!token) return Response.json({ ok: true, busy: true });
  const out: { ok: boolean; sent?: number; failed?: number; digest?: boolean } = { ok: true };
  try {
    Object.assign(out, await runDue(svc.posts, Date.now()));
    const now = addisNow(Date.now());
    const admin = (process.env.TELEGRAM_ADMIN_CHAT_ID ?? "").trim();
    if (admin && svc.telegram && isDigestTime(now.day, now.time)) {
      const [report, posts] = await Promise.all([analytics().report("week"), svc.posts.store.between(addDays(now.day, -7), addDays(now.day, -1))]);
      await svc.telegram.client.post(admin, { html: weeklyDigest(report, posts) });
      out.digest = true;
    }
  } catch (e) {
    reportError("posts run failed", e);
    out.ok = false;
  } finally {
    if (lock && token !== "none") await lock.release("posts:run", token);
  }
  return Response.json(out, { status: out.ok ? 200 : 500 });
}

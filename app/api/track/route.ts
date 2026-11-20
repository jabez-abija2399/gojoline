import { createHash } from "node:crypto";
import { z } from "zod";
import { readCapped } from "@/lib/api/body";
import { CLICK_NAMES, CLICK_PAGES, clickKey } from "@/lib/analytics/clicks";
import { sameOrigin } from "@/lib/builder/access";
import { ipAllowed } from "@/lib/cloud/ip-limit";
import { ipBucket } from "@/lib/cloud/submit";
import { addisDay } from "@/lib/dashboard/stats";
import { reportError } from "@/lib/observability/report";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

/**
 * One click on a counted link (lib/analytics/clicks.ts), sent by the page's listener with
 * sendBeacon. Only a name and a kind of page from fixed lists are accepted and only a daily count
 * is kept: no URL, no user, no address. Each network (hashed, in Redis for a day) counts once per
 * link and day, so repeating requests can't inflate the numbers. Always answers 204.
 */
const body = z.object({ n: z.enum(CLICK_NAMES), p: z.enum(CLICK_PAGES) }).strict();
const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // Our own pages only; a cheap limit per address before anything else.
  if (!(await sameOrigin())) return done();
  const svc = services();
  const ip = await clientIp();
  // A failing limiter (Redis down) never shows: the click just isn't counted.
  if (!(await ipAllowed(svc.rateLimiter, "track", ip, 300).catch(() => false))) return done();
  const raw = await readCapped(request, 200);
  if (raw === null) return done();
  let value: unknown = null;
  try {
    value = JSON.parse(raw);
  } catch {
    return done();
  }
  const parsed = body.safeParse(value);
  if (!parsed.success) return done();
  const day = addisDay(Date.now());
  const key = clickKey(parsed.data.n, parsed.data.p);
  const network = createHash("sha256").update(`gojo-track:${ipBucket(ip)}`).digest("hex").slice(0, 24);
  const first = await svc.rateLimiter.hit(`track-once:${network}:${day}:${key}`, 1, 86_400_000).catch(() => ({ allowed: false }));
  if (!first.allowed) return done();
  await svc.analyticsEvents.bump(day, "click", key).catch((e: unknown) => reportError("click count failed", e));
  return done();
}

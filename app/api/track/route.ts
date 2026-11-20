import { z } from "zod";
import { readCapped } from "@/lib/api/body";
import { CLICK_NAMES, CLICK_PAGES, clickKey } from "@/lib/analytics/clicks";
import { sameOrigin } from "@/lib/builder/access";
import { ipAllowed } from "@/lib/cloud/ip-limit";
import { addisDay } from "@/lib/dashboard/stats";
import { reportError } from "@/lib/observability/report";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

/**
 * One click on a counted link (lib/analytics/clicks.ts), sent by the page's listener with
 * sendBeacon. Only a name and a kind of page from fixed lists are accepted and only a daily count
 * is kept: no URL, no user, no address. Always answers 204 so it never shows in the page.
 */
const body = z.object({ n: z.enum(CLICK_NAMES), p: z.enum(CLICK_PAGES) }).strict();
const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  // Our own pages only; a cheap limit per address before anything else.
  if (!(await sameOrigin())) return done();
  const svc = services();
  if (!(await ipAllowed(svc.rateLimiter, "track", await clientIp(), 60))) return done();
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
  await svc.analyticsEvents.bump(addisDay(Date.now()), "click", clickKey(parsed.data.n, parsed.data.p)).catch((e: unknown) => reportError("click count failed", e));
  return done();
}

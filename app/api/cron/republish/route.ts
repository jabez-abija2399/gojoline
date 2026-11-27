import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { reportError } from "@/lib/observability/report";
import { planRepublish, runRepublish, type RepublishMode } from "@/lib/publish/republish";
import { services } from "@/lib/server/services";

export const maxDuration = 300;

const NO_STORE = { "Cache-Control": "no-store" };
const modeSchema = z.enum(["move", "forward"]);
const bodySchema = z.object({ siteId: z.string().min(1).max(100), mode: modeSchema });

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret ?? ""}`);
  return Boolean(secret) && given.length === want.length && timingSafeEqual(given, want);
}

function deps() {
  const svc = services();
  return svc.publish && svc.moderation ? { publish: svc.publish, sites: svc.moderation.sites } : null;
}

async function liveHere(publisher: unknown, slugs: string[]): Promise<Set<string>> {
  const host = publisher as { isLive?: (slug: string) => Promise<boolean> };
  if (!host.isLive) return new Set();
  const live = await Promise.all(slugs.map(async (s) => ((await host.isLive!(s)) ? s : null)));
  return new Set(live.filter((s): s is string => s !== null));
}

/**
 * Moving sites to the current host, for scripts/republish-all.mts (CRON_SECRET). GET lists what
 * a run would do (the dry run); POST runs it for one site, so each request stays short and a
 * run can be stopped and started again at any point.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 401 });
  const d = deps();
  if (!d) return Response.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  const mode = modeSchema.safeParse(new URL(request.url).searchParams.get("mode") ?? "move");
  if (!mode.success) return Response.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const sites = await d.sites.recent(10_000);
  const live = await liveHere(d.publish.publisher, sites.filter((s) => s.status === "taken_down").map((s) => s.slug));
  return Response.json({ host: d.publish.publisher.name, paused: Boolean(d.publish.paused), items: planRepublish(sites, d.publish.publisher.name, mode.data, live) }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response(null, { status: 401 });
  const d = deps();
  if (!d) return Response.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  // Planned again from the row as it is now: a repeated or stale request does nothing twice.
  const site = await d.sites.byId(body.data.siteId);
  if (!site) return Response.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
  const live = site.status === "taken_down" ? await liveHere(d.publish.publisher, [site.slug]) : new Set<string>();
  const [item] = planRepublish([site], d.publish.publisher.name, body.data.mode as RepublishMode, live);
  try {
    const result = await runRepublish(d.publish, site, item!);
    return Response.json({ item, result }, { headers: NO_STORE });
  } catch (e) {
    reportError("republish failed", e, { siteId: site.id });
    return Response.json({ item, result: { ok: false, error: "failed" } }, { status: 500, headers: NO_STORE });
  }
}

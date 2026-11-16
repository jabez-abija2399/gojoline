import { z } from "zod";
import { allowedOrigin, cors } from "@/lib/cloud/cors";
import { ipAllowed } from "@/lib/cloud/ip-limit";
import { getMessages } from "@/lib/i18n";
import { publicPatch, type InfoLabels } from "@/lib/site-info/business";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

/**
 * Public Data API: what a published site shows at runtime over its built-in content: the
 * owner's business details (contact, hours, banner) and whether the site is resting. Only
 * what the owner chose to show; never messages, emails or anything private.
 * Cached in the visitor's browser only (`private`): a shared cache can't be trusted with
 * Vary: Origin; the server keeps its own one-minute copy (PublicSiteCache).
 */
type Ctx = RouteContext<"/api/public/sites/[siteId]/info">;
const ids = z.object({ siteId: z.uuid() });
const query = z.object({ key: z.string().max(64).optional() }).strict();

function labels(lang: "en" | "am"): InfoLabels {
  const d = getMessages(lang).dashboard;
  return { days: d.info.days, closed: d.info.closed, closedToday: d.info.closedTodayNotice, closedForNow: d.info.closedForNowNotice };
}

const noStore = { "Cache-Control": "no-store" };

async function entry(ctx: Ctx) {
  const params = ids.safeParse(await ctx.params);
  return params.success ? services().publicSites.get(params.data.siteId) : null;
}

export async function OPTIONS(request: Request, ctx: Ctx) {
  if (!(await ipAllowed(services().rateLimiter, "info", await clientIp(), 120))) return new Response(null, { status: 429 });
  const allowed = allowedOrigin((await entry(ctx))?.site ?? null, request.headers.get("origin"));
  return new Response(null, { status: allowed ? 204 : 403, headers: cors(allowed, "GET") });
}

export async function GET(request: Request, ctx: Ctx) {
  // Limit by address before anything touches the database.
  if (!(await ipAllowed(services().rateLimiter, "info", await clientIp(), 120))) return Response.json({ error: "too_many" }, { status: 429, headers: noStore });
  const q = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!q.success) return Response.json({ error: "invalid" }, { status: 400, headers: noStore });
  const e = await entry(ctx);
  if (!e || e.site.status !== "published") return Response.json({ error: "not_found" }, { status: 404, headers: noStore });
  const allowed = allowedOrigin(e.site, request.headers.get("origin"));
  // The key comes in the query (a simple GET needs no preflight on slow phones) or the header.
  const key = q.data.key ?? request.headers.get("x-site-key");
  if (!allowed || !e.site.siteKey || key !== e.site.siteKey) return Response.json({ error: "forbidden" }, { status: 403, headers: { ...cors(allowed, "GET"), ...noStore } });
  const body = { offline: e.site.offline, ...publicPatch(e.site.offline ? null : e.business, { en: labels("en"), am: labels("am") }) };
  return Response.json(body, { headers: { ...cors(allowed, "GET"), "Cache-Control": "private, max-age=60" } });
}

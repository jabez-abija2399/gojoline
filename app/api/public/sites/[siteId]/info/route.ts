import { z } from "zod";
import { allowedOrigin, cors } from "@/lib/cloud/cors";
import { getMessages } from "@/lib/i18n";
import { publicPatch, type InfoLabels } from "@/lib/site-info/business";
import { services } from "@/lib/server/services";

/**
 * Public Data API: what a published site shows at runtime over its built-in content: the
 * owner's business details (contact, hours, banner) and whether the site is resting. Only
 * what the owner chose to show; never messages, emails or anything private. Cached ~60 s.
 */
type Ctx = RouteContext<"/api/public/sites/[siteId]/info">;
const ids = z.object({ siteId: z.uuid() });

function labels(lang: "en" | "am"): InfoLabels {
  const d = getMessages(lang).dashboard;
  return { days: d.info.days, closed: d.info.closed, closedToday: d.info.closedTodayNotice, closedForNow: d.info.closedForNowNotice };
}

async function site(ctx: Ctx) {
  const params = ids.safeParse(await ctx.params);
  const cloud = services().cloud;
  if (!params.success || !cloud) return null;
  return cloud.publicSite(params.data.siteId);
}

export async function OPTIONS(request: Request, ctx: Ctx) {
  const allowed = allowedOrigin(await site(ctx), request.headers.get("origin"));
  return new Response(null, { status: allowed ? 204 : 403, headers: cors(allowed, "GET") });
}

export async function GET(request: Request, ctx: Ctx) {
  const s = await site(ctx);
  if (!s || s.status !== "published") return Response.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const allowed = allowedOrigin(s, request.headers.get("origin"));
  // The key comes in the query (a simple GET needs no preflight on slow phones) or the header.
  const key = new URL(request.url).searchParams.get("key") ?? request.headers.get("x-site-key");
  if (!allowed || !s.siteKey || key !== s.siteKey) return Response.json({ error: "forbidden" }, { status: 403, headers: { ...cors(allowed, "GET"), "Cache-Control": "no-store" } });
  const business = s.offline ? null : await services().siteSettings.publicBusiness(s.projectId).catch(() => null);
  const body = { offline: s.offline, ...publicPatch(business, { en: labels("en"), am: labels("am") }) };
  return Response.json(body, { headers: { ...cors(allowed, "GET"), "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } });
}

import { after } from "next/server";
import { z } from "zod";
import { readCapped } from "@/lib/api/body";
import { allowedOrigin, cors } from "@/lib/cloud/cors";
import { ipAllowed } from "@/lib/cloud/ip-limit";
import { reportError } from "@/lib/observability/report";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";
import { MAX_VISIT_BYTES, recordVisit } from "@/lib/visits/record";

/**
 * Public Data API: one page view from a published site's beacon (privacy-friendly: no cookies,
 * no IPs stored; see lib/visits). Answers 204 at once; the counting runs after the response.
 */
type Ctx = RouteContext<"/api/public/sites/[siteId]/visits">;
const ids = z.object({ siteId: z.uuid() });

export async function OPTIONS(request: Request, ctx: Ctx) {
  const params = ids.safeParse(await ctx.params);
  if (!params.success) return new Response(null, { status: 404 });
  if (!(await ipAllowed(services().rateLimiter, "visit", await clientIp(), 120))) return new Response(null, { status: 429 });
  const allowed = allowedOrigin((await services().publicSites.get(params.data.siteId))?.site ?? null, request.headers.get("origin"));
  return new Response(null, { status: allowed ? 204 : 403, headers: cors(allowed, "POST") });
}

export async function POST(request: Request, ctx: Ctx) {
  const params = ids.safeParse(await ctx.params);
  const svc = services();
  if (!params.success) return new Response(null, { status: 404 });
  const ip = await clientIp();
  // Limit by address before reading the body or the database.
  if (!(await ipAllowed(svc.rateLimiter, "visit", ip, 120))) return new Response(null, { status: 429 });
  const raw = await readCapped(request, MAX_VISIT_BYTES);
  if (raw === null) return new Response(null, { status: 413 });
  const r = await recordVisit(
    { publicSite: async (id) => (await svc.publicSites.get(id))?.site ?? null, counter: svc.visits.counter, limiter: svc.rateLimiter },
    { projectId: params.data.siteId, origin: request.headers.get("origin"), siteKey: request.headers.get("x-site-key"), ip, userAgent: request.headers.get("user-agent") ?? "", fetchSite: request.headers.get("sec-fetch-site"), raw },
  ).catch((e: unknown) => {
    reportError("visit failed", e);
    return { status: 204, allowOrigin: null, count: undefined };
  });
  if (r.count) {
    const count = r.count;
    after(() => count().catch((e: unknown) => reportError("visit count failed", e)));
  }
  return new Response(null, { status: r.status, headers: { ...cors(r.allowOrigin, "POST"), "Cache-Control": "no-store" } });
}

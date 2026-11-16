import { after } from "next/server";
import { z } from "zod";
import { allowedOrigin, cors } from "@/lib/cloud/cors";
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
  const cloud = services().cloud;
  if (!params.success || !cloud) return new Response(null, { status: 404 });
  const allowed = allowedOrigin(await cloud.publicSite(params.data.siteId), request.headers.get("origin"));
  return new Response(null, { status: allowed ? 204 : 403, headers: cors(allowed, "POST") });
}

export async function POST(request: Request, ctx: Ctx) {
  const params = ids.safeParse(await ctx.params);
  const svc = services();
  if (!params.success || !svc.cloud) return new Response(null, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_VISIT_BYTES) return new Response(null, { status: 413 });
  const raw = await request.text();
  const r = await recordVisit(
    { publicSite: (id) => svc.cloud!.publicSite(id), counter: svc.visits.counter, limiter: svc.rateLimiter },
    { projectId: params.data.siteId, origin: request.headers.get("origin"), siteKey: request.headers.get("x-site-key"), ip: await clientIp(), userAgent: request.headers.get("user-agent") ?? "", raw },
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

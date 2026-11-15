import { z } from "zod";
import { handleSubmission, siteOrigins } from "@/lib/cloud/submit";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

/** Public Data API: published sites post their form answers here (CORS, per-site key). */
type Ctx = RouteContext<"/api/public/sites/[siteId]/forms/[formKey]">;

function cors(origin: string | null): Record<string, string> {
  return origin
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Site-Key",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
    : { Vary: "Origin" };
}

const ids = z.object({ siteId: z.uuid(), formKey: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/) });

export async function OPTIONS(request: Request, ctx: Ctx) {
  const params = ids.safeParse(await ctx.params);
  const cloud = services().cloud;
  if (!params.success || !cloud) return new Response(null, { status: 404 });
  const site = await cloud.publicSite(params.data.siteId);
  const origin = request.headers.get("origin");
  const allowed = site && origin && siteOrigins(site).includes(origin) ? origin : null;
  return new Response(null, { status: allowed ? 204 : 403, headers: cors(allowed) });
}

export async function POST(request: Request, ctx: Ctx) {
  const params = ids.safeParse(await ctx.params);
  const cloud = services().cloud;
  if (!params.success || !cloud) return Response.json({ error: "not_found" }, { status: 404 });
  if (Number(request.headers.get("content-length") ?? 0) > 20_000) return Response.json({ error: "too_large" }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 20_000) return Response.json({ error: "too_large" }, { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  const result = await handleSubmission(
    { cloud, limiter: services().rateLimiter, notifier: services().notifier ?? undefined, entitlements: services().entitlements },
    {
      projectId: params.data.siteId,
      formKey: params.data.formKey,
      origin: request.headers.get("origin"),
      siteKey: request.headers.get("x-site-key"),
      ip: await clientIp(),
      body,
    },
  );
  return Response.json(result.body, { status: result.status, headers: { ...cors(result.allowOrigin), "Cache-Control": "no-store" } });
}

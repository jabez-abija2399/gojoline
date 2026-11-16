import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { businessInfo } from "@/lib/site-info/business";
import { services } from "@/lib/server/services";

/** The owner's quick business details (no AI, no rebuild): the live site reads them within a minute. */
export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/business">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  return json(200, { business: (await services().siteSettings.get(r.user.id, id)).business ?? {} });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/projects/[id]/business">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "business-info", perHour: 120 } });
  if (!r.ok) return r.response;
  if (Number(request.headers.get("content-length") ?? 0) > 8_000) return json(413, { error: "too_large" });
  const parsed = businessInfo.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") });
  await services().siteSettings.saveBusiness(r.user.id, id, parsed.data);
  return json(200, { business: parsed.data });
}

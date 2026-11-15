import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { services } from "@/lib/server/services";

const NAME = /^[a-z0-9-]{1,60}\.webp$/;

/** Owner-only view of an uploaded photo (thumbnails in the dashboard). */
export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/assets/[name]">) {
  const { id, name } = await ctx.params;
  if (!NAME.test(name)) return json(404, { error: "not_found" });
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const asset = await services().builder?.assets?.get(r.user.id, id, name);
  if (!asset) return json(404, { error: "not_found" });
  return new Response(new Uint8Array(asset.data), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" },
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/projects/[id]/assets/[name]">) {
  const { id, name } = await ctx.params;
  if (!NAME.test(name)) return json(404, { error: "not_found" });
  const r = await ownerRoute(id, { mutating: true, limit: { name: "upload", perHour: 120 } });
  if (!r.ok) return r.response;
  await services().builder?.assets?.remove(r.user.id, id, name);
  return json(200, { ok: true });
}

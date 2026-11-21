import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { services } from "@/lib/server/services";

/**
 * The picture on one of the owner's site cards. The list links it with ?k=<content hash>, so a
 * new picture gets a new address and the old one can be cached for good (privately: it may be a
 * draft's photo).
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/card">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const thumb = await services().builder?.cards?.thumb(r.user.id, id);
  if (!thumb) return json(404, { error: "not_found" });
  return new Response(new Uint8Array(thumb.data), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}

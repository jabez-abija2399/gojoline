import sharp from "sharp";
import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { services } from "@/lib/server/services";

/**
 * The picture on one of the owner's site cards. The list links it with ?k=<content hash>, so a
 * new picture gets a new address and the old one can be cached for good (privately: it may be a
 * draft's photo).
 */
export async function GET(request: Request, ctx: RouteContext<"/api/projects/[id]/card">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const thumb = await services().builder?.cards?.thumb(r.user.id, id);
  if (!thumb) return json(404, { error: "not_found" });
  const q = new URL(request.url).searchParams;
  // Phones show the picture 96 px wide: a small copy, made from the stored one.
  const data = q.get("w") === "192" ? await sharp(thumb.data).resize({ width: 192, height: 192, fit: "cover" }).webp({ quality: 60 }).toBuffer() : thumb.data;
  // Cached for good only at the address of the picture it is (an old address gets today's, uncached).
  const fresh = q.get("k") === thumb.key;
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/webp", "Cache-Control": fresh ? "private, max-age=31536000, immutable" : "private, no-cache", "X-Content-Type-Options": "nosniff" },
  });
}

import { z } from "zod";
import { services } from "@/lib/server/services";
import { libraryPhoto } from "@/lib/template/files";

/**
 * The home page photo of a site in the public showcase. Only for sites listed there right now
 * (opted in, live, not hidden or taken down); anything else is 404.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/showcase/[siteId]/image">) {
  const { siteId } = await ctx.params;
  if (!z.uuid().safeParse(siteId).success) return new Response(null, { status: 404 });
  const svc = services();
  const entry = await svc.growth.showcase?.entry(siteId).catch(() => null);
  if (!entry?.image) return new Response(null, { status: 404 });
  let data: Buffer | null = null;
  const stock = /^\/stock\/([a-z0-9-]+\.webp)$/.exec(entry.image)?.[1];
  const own = /^\/images\/([a-z0-9-]{1,60}\.webp)$/.exec(entry.image)?.[1];
  if (stock) data = libraryPhoto(stock);
  else if (own) data = (await svc.builder?.assets?.get(entry.ownerId, entry.projectId, own).catch(() => null))?.data ?? null;
  if (!data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" },
  });
}

import { services } from "@/lib/server/services";

/**
 * A showcase card's photo: the ~640 px WebP saved at publish, addressed by its content hash, so
 * it never changes and can sit in shared caches. Only while a listed site uses it; else 404.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/showcase/image/[key]">) {
  const { key } = await ctx.params;
  if (!/^[0-9a-f]{32}$/.test(key)) return new Response(null, { status: 404 });
  const data = await services().growth.showcase?.thumb(key).catch(() => null);
  if (!data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      // Public pictures of public sites; a hidden site's photo can stay cached up to a day.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}

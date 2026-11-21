import { z } from "zod";
import { verifyMediaUrl } from "@/lib/posts/media-url";
import { services } from "@/lib/server/services";

/**
 * A post's picture or video for a network that fetches it itself (Instagram), only with a valid,
 * unexpired signature for this post (see lib/posts/media-url.ts). Nothing else is served here.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/public/post-media/[id]">) {
  const id = z.uuid().safeParse((await ctx.params).id);
  const q = new URL(request.url).searchParams;
  if (!id.success || !verifyMediaUrl(process.env.CRON_SECRET ?? "", id.data, q.get("exp"), q.get("sig"))) return new Response(null, { status: 404 });
  const deps = services().posts;
  const post = await deps.store.get(id.data);
  const file = post && post.status !== "skipped" ? await deps.media(post.media).catch(() => null) : null;
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "Content-Type": file.kind === "video" ? "video/mp4" : "image/jpeg", "Content-Length": String(file.data.length), "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" },
  });
}

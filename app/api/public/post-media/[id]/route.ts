import { z } from "zod";
import { verifyMediaUrl } from "@/lib/posts/media-url";
import { services } from "@/lib/server/services";
import { ipAllowed } from "@/lib/cloud/ip-limit";
import { clientIp } from "@/lib/server/request";

/**
 * A post's picture or video for a network that fetches it itself (Instagram), only with a valid,
 * unexpired signature for this post (see lib/posts/media-url.ts). Nothing else is served here.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/public/post-media/[id]">) {
  const id = z.uuid().safeParse((await ctx.params).id);
  const q = new URL(request.url).searchParams;
  if (!id.success || !verifyMediaUrl(process.env.CRON_SECRET ?? "", id.data, q.get("exp"), q.get("sig"))) return new Response(null, { status: 404 });
  // A network fetches a post's media once or twice: a leaked link can't be used to pull it in a loop.
  if (!(await ipAllowed(services().rateLimiter, "post-media", await clientIp(), 20).catch(() => false))) return new Response(null, { status: 429 });
  const deps = services().posts;
  const post = await deps.store.get(id.data);
  // A site's media only while its owner still shows it (they may have opted out since the link was made).
  const allowed = post && post.status !== "skipped" && (post.kind !== "site" || (await deps.context()).sites.some((s) => s.siteId === post.subject));
  const file = allowed ? await deps.media(post.media).catch(() => null) : null;
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file.data.buffer as ArrayBuffer, file.data.byteOffset, file.data.byteLength), {
    headers: { "Content-Type": file.kind === "video" ? "video/mp4" : "image/jpeg", "Content-Length": String(file.data.length), "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" },
  });
}

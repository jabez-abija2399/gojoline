import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";
import { templatePreview } from "@/lib/posts/service";

/** A post's picture or video, for the admin's preview and the posting kit (?download=1 saves it). */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/posts/[id]/media">) {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return new Response(null, { status: 404 });
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return new Response(null, { status: 404 });
  const deps = services().posts;
  const post = await deps.store.get(id.data);
  const download = new URL(request.url).searchParams.get("download") === "1";
  // The preview of a template post: the stored WebP as it is (small, no re-encoding).
  if (post?.media?.type === "template" && !download) {
    const webp = await templatePreview(post.media.id);
    if (webp) return new Response(new Uint8Array(webp), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });
  }
  const file = post ? await deps.media(post.media).catch(() => null) : null;
  if (!file) return new Response(null, { status: 404 });
  // Videos play in the preview only with byte ranges (iPhone Safari asks for them).
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && file.kind === "video" && !download) {
    const size = file.data.length;
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2] || 0));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (!(start <= end && start < size)) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(file.data.subarray(start, end + 1)), {
      status: 206,
      headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": String(end - start + 1), "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
  }
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.kind === "video" ? "video/mp4" : "image/jpeg",
      ...(file.kind === "video" ? { "Accept-Ranges": "bytes" } : {}),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      ...(download ? { "Content-Disposition": `attachment; filename="gojoline-${post!.day}-${file.name}"` } : {}),
    },
  });
}

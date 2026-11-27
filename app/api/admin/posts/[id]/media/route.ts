import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";
import { keepVideo, templatePreview } from "@/lib/posts/service";
import { sameOrigin } from "@/lib/builder/access";
import { reportError } from "@/lib/observability/report";
import { readVideoUpload, MAX_UPLOAD_BYTES } from "@/lib/posts/upload";
import { CleanError } from "@/lib/posts/video";

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
    // An open-ended range ("bytes=0-", what browsers send first) gets at most 2 MB: enough to start playing.
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : range[1] ? Math.min(start + 2 * 1024 * 1024 - 1, size - 1) : size - 1;
    if (!(start <= end && start < size)) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(file.data.buffer as ArrayBuffer, file.data.byteOffset + start, end - start + 1), {
      status: 206,
      headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": String(end - start + 1), "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
  }
  return new Response(new Uint8Array(file.data.buffer as ArrayBuffer, file.data.byteOffset, file.data.byteLength), {
    headers: {
      "Content-Type": file.kind === "video" ? "video/mp4" : "image/jpeg",
      ...(file.kind === "video" ? { "Accept-Ranges": "bytes" } : {}),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      ...(download ? { "Content-Disposition": `attachment; filename="gojoline-${post!.day}-${file.name}"` } : {}),
    },
  });
}

/**
 * Admin → Posts → Videos: replaces a post's media with a video the admin filmed (MP4, up to
 * MAX_UPLOAD_BYTES). Our own pages only, one upload at a time. The video server checks it is a
 * real video and strips its metadata (GPS location, device) before it is stored; the file it
 * replaces is deleted.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/posts/[id]/media">) {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return new Response(null, { status: 404 });
  if (!(await sameOrigin())) return Response.json({ error: "origin" }, { status: 403 });
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return new Response(null, { status: 404 });
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_UPLOAD_BYTES) return Response.json({ error: "too_big" }, { status: 413 });
  const deps = services().posts;
  if (!deps.video) return Response.json({ error: "no_renderer" }, { status: 503 });
  const post = await deps.store.get(id.data);
  if (!post) return new Response(null, { status: 404 });
  if (post.status === "posted") return Response.json({ error: "posted" }, { status: 409 });
  // One upload at a time: each holds a video in memory while it is checked and stored.
  const token = await deps.lock.acquire("posts:upload", 5 * 60_000);
  if (!token) return Response.json({ error: "busy" }, { status: 429 });
  try {
    const upload = await readVideoUpload(request.body, MAX_UPLOAD_BYTES);
    if ("error" in upload) return Response.json({ error: upload.error }, { status: upload.error === "too_big" ? 413 : 415 });
    const clean = await deps.video.clean(upload.data).catch((e: unknown) => {
      if (e instanceof CleanError) return e;
      throw e;
    });
    if (clean instanceof CleanError) return Response.json({ error: clean.code }, { status: clean.code === "busy" ? 503 : 422 });
    const key = `posts/${post.id}-upload-${Date.now()}.mp4`;
    await deps.files.put(key, clean, { contentType: "video/mp4" });
    await keepVideo(deps, post.id, key);
    // The upload it replaces is gone for good (generated videos keep their fixed names and are overwritten).
    const old = post.media?.type === "video" ? post.media.key : null;
    if (old && old.startsWith(`posts/${post.id}-upload-`)) await deps.files.delete(old).catch((e: unknown) => reportError("old upload delete failed", e));
    return Response.json({ ok: true });
  } catch (e) {
    reportError("post video upload failed", e);
    return Response.json({ error: "failed" }, { status: 500 });
  } finally {
    await deps.lock.release("posts:upload", token);
  }
}

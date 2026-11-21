import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";

/** A post's picture or video, for the admin's preview and the posting kit (?download=1 saves it). */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/posts/[id]/media">) {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return new Response(null, { status: 404 });
  const id = z.uuid().safeParse((await ctx.params).id);
  if (!id.success) return new Response(null, { status: 404 });
  const deps = services().posts;
  const post = await deps.store.get(id.data);
  const file = post ? await deps.media(post.media).catch(() => null) : null;
  if (!file) return new Response(null, { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.kind === "video" ? "video/mp4" : "image/jpeg",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      ...(download ? { "Content-Disposition": `attachment; filename="gojoline-${post!.day}-${file.name}"` } : {}),
    },
  });
}

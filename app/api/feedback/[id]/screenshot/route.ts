import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";

/** Owners open their own few pictures; an admin's list shows up to 100 thumbnails at once. */
const PER_HOUR = { owner: 120, admin: 1200 };

/**
 * A feedback screenshot (`?size=thumb` for the ~480 px thumbnail), for the owner who sent it or an
 * admin. Anyone else gets the same 404 as a missing one. The pictures never change once stored.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/feedback/[id]/screenshot">) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user || !z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  const admin = isAdmin(user);
  const svc = services();
  const limit = await svc.rateLimiter.hit(`fb:shot:${user.id}`, admin ? PER_HOUR.admin : PER_HOUR.owner, 3_600_000);
  if (!limit.allowed) return new Response(null, { status: 429, headers: { "Retry-After": "3600" } });
  const size = new URL(request.url).searchParams.get("size") === "thumb" ? "thumb" : "full";
  const image = await svc.feedback.screenshot(id, admin ? null : user.id, size);
  if (!image) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(image), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=86400, immutable", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" },
  });
}

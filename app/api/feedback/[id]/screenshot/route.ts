import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";

/** A feedback screenshot, for the owner who sent it or an admin. Anyone else gets the same 404 as a missing one. */
export async function GET(_request: Request, ctx: RouteContext<"/api/feedback/[id]/screenshot">) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user || !z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  const image = await services().feedback.screenshot(id, isAdmin(user) ? null : user.id);
  if (!image) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" } });
}

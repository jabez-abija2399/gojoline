import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";

/** Receipt photo for an admin reviewing a payment. */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/payments/[id]/receipt">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success || !isAdmin(await currentUser())) return new Response(null, { status: 404 });
  const receipt = await services().billing.store().receipt(id);
  if (!receipt) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(receipt), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

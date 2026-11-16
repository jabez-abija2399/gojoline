import { z } from "zod";
import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { setSiteOffline } from "@/lib/publish/offline";
import { services } from "@/lib/server/services";

const body = z.object({ offline: z.boolean() }).strict();

/** "Take site offline" / "Put back online" (the owner's own switch, not an admin takedown). */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/offline">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "offline", perHour: 30 } });
  if (!r.ok) return r.response;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  const deps = services().publish;
  if (!deps) return json(503, { error: "unavailable" });
  const out = await setSiteOffline(deps, r.user.id, id, parsed.data.offline);
  if (!out.ok) return json(out.error === "not_found" ? 404 : 409, { error: out.error });
  return json(200, { offline: Boolean(out.site.offlineAt) });
}

import { z } from "zod";
import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { services } from "@/lib/server/services";
import { invalidateShowcase } from "@/lib/growth/showcase-cache";

const body = z.object({ on: z.boolean() }).strict();

/** The owner's current choice (null when the project has no site yet). */
export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/showcase">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  return json(200, { on: (await services().growth.showcase?.optedIn(r.user.id, id)) ?? null });
}

/** “Show my site in the Gojoline showcase and posts” (the owner's own site only; off by default). */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/showcase">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "showcase", perHour: 30 } });
  if (!r.ok) return r.response;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  const showcase = services().growth.showcase;
  if (!showcase) return json(503, { error: "unavailable" });
  if (!(await showcase.setOptIn(r.user.id, id, parsed.data.on))) return json(404, { error: "not_found" });
  invalidateShowcase();
  return json(200, { on: parsed.data.on });
}

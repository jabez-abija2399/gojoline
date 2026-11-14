import { z } from "zod";
import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { services } from "@/lib/server/services";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/submissions">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const cloud = services().cloud;
  return json(200, { submissions: cloud ? await cloud.listSubmissions(r.user.id, id) : [] });
}

const body = z.object({ ids: z.array(z.uuid()).max(500) }).strict();

/** Marks answers as read. */
export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/submissions">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true });
  if (!r.ok) return r.response;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  await services().cloud?.markRead(r.user.id, id, parsed.data.ids);
  return json(200, { ok: true });
}

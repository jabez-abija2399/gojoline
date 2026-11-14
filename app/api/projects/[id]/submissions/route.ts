import { z } from "zod";
import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { services } from "@/lib/server/services";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/submissions">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const cloud = services().cloud;
  const submissions = cloud ? await cloud.listSubmissions(r.user.id, id) : [];
  // Field labels and form headings so the owner sees "Phone", not "phone".
  const forms: Record<string, { heading: Record<string, string>; labels: Record<string, Record<string, string>> }> = {};
  for (const s of submissions) {
    if (forms[s.formKey] || !cloud) continue;
    const def = await cloud.getForm(s.siteId, s.formKey);
    if (def) forms[s.formKey] = { heading: def.heading, labels: Object.fromEntries(def.fields.map((f) => [f.name, f.label])) };
  }
  return json(200, { submissions, forms });
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

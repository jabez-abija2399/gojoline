import { z } from "zod";
import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { MESSAGE_STATUSES } from "@/lib/dashboard/message-status";
import { services } from "@/lib/server/services";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/submissions">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const cloud = services().cloud;
  const submissions = cloud ? await cloud.listSubmissions(r.user.id, id) : [];
  // Field labels and form headings so the owner sees "Phone", not "phone".
  const forms: Record<string, { heading: Record<string, string>; labels: Record<string, Record<string, string>> }> = {};
  const siteId = submissions[0]?.siteId;
  const defs = cloud && siteId ? await cloud.getForms(siteId, [...new Set(submissions.map((s) => s.formKey))]) : [];
  for (const def of defs) forms[def.id] = { heading: def.heading, labels: Object.fromEntries(def.fields.map((f) => [f.name, f.label])) };
  return json(200, { submissions, forms });
}

const statusBody = z.object({ ids: z.array(z.uuid()).min(1).max(500), status: z.enum(MESSAGE_STATUSES) }).strict();

/** Moves messages to New, Replied or Done (only the moves canMove allows). */
export async function PATCH(request: Request, ctx: RouteContext<"/api/projects/[id]/submissions">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true });
  if (!r.ok) return r.response;
  const parsed = statusBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  const changed = (await services().cloud?.setStatus(r.user.id, id, parsed.data.ids, parsed.data.status)) ?? 0;
  return json(200, { changed });
}

const deleteBody = z.object({ id: z.uuid() }).strict();

/** Deletes one message for good (the page asks first). */
export async function DELETE(request: Request, ctx: RouteContext<"/api/projects/[id]/submissions">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "delete-message", perHour: 300 } });
  if (!r.ok) return r.response;
  const parsed = deleteBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  const ok = (await services().cloud?.deleteSubmission(r.user.id, id, parsed.data.id)) ?? false;
  return ok ? json(200, { ok: true }) : json(404, { error: "not_found" });
}

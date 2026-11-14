import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { saveListEdit } from "@/lib/cloud/content-service";
import { listEditSchema, readLists } from "@/lib/cloud/lists";
import { services } from "@/lib/server/services";

export const maxDuration = 300;

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/lists">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const latest = await r.builder.store.latestVersion(r.user.id, id);
  return json(200, latest?.files["src/site.json"] ? (readLists(latest.files["src/site.json"]) ?? { languages: ["en"], lists: [] }) : { languages: ["en"], lists: [] });
}

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/lists">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "list-edit", perHour: 60 } });
  if (!r.ok) return r.response;
  const parsed = listEditSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid" });
  const result = await saveListEdit(r.builder, services().publish, r.user, id, parsed.data);
  return result.ok ? json(200, result) : json(result.error === "busy" ? 409 : 422, { error: result.error });
}

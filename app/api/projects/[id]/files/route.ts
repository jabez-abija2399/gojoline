import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";

/** Read-only file view of the latest version. */
export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/files">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return json(404, { error: "not_found" });
  const g = await guardBuilder({ mutating: false });
  if (!g.ok) return g.response;
  if (!(await g.builder.store.getProject(g.owner, id))) return json(404, { error: "not_found" });
  const latest = await g.builder.store.latestVersion(g.owner, id);
  return json(200, { files: latest?.files ?? {} });
}

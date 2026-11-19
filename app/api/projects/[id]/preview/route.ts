import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";

export const maxDuration = 60;

/** Opens (or wakes) the project's sandbox with its latest version and returns the preview URL. */
export async function POST(_request: Request, ctx: RouteContext<"/api/projects/[id]/preview">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return json(404, { error: "not_found" });
  const g = await guardBuilder({ mutating: true, limit: { name: "preview", perHour: 60 } });
  if (!g.ok) return g.response;
  if (!(await g.builder.store.getProject(g.owner, id))) return json(404, { error: "not_found" });
  if (g.builder.paused) return json(503, { error: "paused" });
  const latest = await g.builder.store.latestVersion(g.owner, id);
  if (!latest) return json(200, { url: null });
  const sandbox = await g.builder.sandboxes.open(id, latest.files);
  return json(200, { url: sandbox.previewUrl });
}

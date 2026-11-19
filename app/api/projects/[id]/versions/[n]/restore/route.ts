import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";
import { restoreVersion } from "@/lib/builder/service";

export const maxDuration = 60;

export async function POST(_request: Request, ctx: RouteContext<"/api/projects/[id]/versions/[n]/restore">) {
  const { id, n } = await ctx.params;
  const number = Number(n);
  if (!z.uuid().safeParse(id).success || !Number.isInteger(number) || number < 1) return json(404, { error: "not_found" });
  const g = await guardBuilder({ mutating: true, limit: { name: "restore", perHour: 60 } });
  if (!g.ok) return g.response;
  if (g.builder.paused) return json(503, { error: "paused" });
  const version = await restoreVersion(g.builder, { ownerId: g.owner, projectId: id, number });
  if (!version) return json(409, { error: "restore_failed" });
  const versions = await g.builder.store.listVersions(g.owner, id);
  return json(200, { version: { number: version.number, summary: version.summary }, versions });
}

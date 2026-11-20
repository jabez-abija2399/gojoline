import { z } from "zod";
import { json } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";

/** A site's latest files, for Gojoline staff helping its owner (owners change sites through the chat). */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/sites/[id]/files">) {
  const { id } = await ctx.params;
  // Not admin: the same answer as a missing site.
  if (!z.uuid().safeParse(id).success || !isAdmin(await currentUser())) return json(404, { error: "not_found" });
  const svc = services();
  const site = await svc.moderation?.sites.byId(id);
  const builder = svc.builder;
  if (!site || !builder) return json(404, { error: "not_found" });
  const latest = await builder.store.latestVersion(site.ownerId, site.projectId);
  return json(200, { files: latest?.files ?? {} });
}

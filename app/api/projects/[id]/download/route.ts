import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";
import { downloadSite } from "@/lib/publish/download";
import { services } from "@/lib/server/services";

export const maxDuration = 300;

/**
 * "Download your website" (Business): the live site as a ZIP, built on request. POST with the
 * same-origin check, so another site can't make an owner's browser start builds.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/projects/[id]/download">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return json(404, { error: "not_found" });
  // Each download is a full build: a few an hour is plenty for an owner.
  const g = await guardBuilder({ mutating: true, limit: { name: "site-download", perHour: 6, fixed: true } });
  if (!g.ok) return g.response;
  const deps = services().publish;
  if (!deps) return json(503, { error: "unavailable" });
  const outcome = await downloadSite(deps, g.owner, id);
  if (!outcome.ok) {
    const status = outcome.error === "not_found" ? 404 : outcome.error === "plan_required" ? 403 : outcome.error === "too_large" ? 413 : outcome.error === "failed" || outcome.error === "build_failed" ? 502 : 409;
    return json(status, { error: outcome.error });
  }
  const { zip } = outcome;
  return new Response(new Uint8Array(zip.buffer as ArrayBuffer, zip.byteOffset, zip.byteLength), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${outcome.filename}"`,
      "Content-Length": String(zip.byteLength),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

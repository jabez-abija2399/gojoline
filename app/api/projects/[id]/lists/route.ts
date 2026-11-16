import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { readLists } from "@/lib/cloud/lists";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/lists">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const latest = await r.builder.store.latestVersion(r.user.id, id);
  return json(200, latest?.files["src/site.json"] ? (readLists(latest.files["src/site.json"]) ?? { languages: ["en"], lists: [] }) : { languages: ["en"], lists: [] });
}

/**
 * Editing lists without the AI is gone (2026-11-16): content changes go through the AI so they
 * use credits. Old clients get 410 Gone; nothing is read or written.
 */
export function POST() {
  return json(410, { error: "gone" });
}

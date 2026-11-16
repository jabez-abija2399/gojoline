import { ownerRoute } from "@/lib/api/owner";
import { toCsv } from "@/lib/cloud/csv";
import { services } from "@/lib/server/services";

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/submissions/export">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const rows = (await services().cloud?.listSubmissions(r.user.id, id, 5000)) ?? [];
  return new Response(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="gojoline-messages.csv"`, "Cache-Control": "no-store" },
  });
}

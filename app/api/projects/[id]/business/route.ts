import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { readLists } from "@/lib/cloud/lists";
import { readJsonCapped } from "@/lib/api/body";
import { businessInfo } from "@/lib/site-info/business";
import { businessTexts } from "@/lib/site-info/owner-text";
import { blockedText } from "@/lib/site-info/save";
import { services } from "@/lib/server/services";

/** The owner's quick business details (no AI, no rebuild): the live site reads them within a minute. */
export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/business">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  const [settings, latest] = await Promise.all([services().siteSettings.get(r.user.id, id), r.builder.store.latestVersion(r.user.id, id)]);
  // The site's languages decide which address and banner boxes to show.
  const languages = (latest?.files["src/site.json"] ? readLists(latest.files["src/site.json"])?.languages : null) ?? ["en"];
  return json(200, { business: settings.business ?? {}, languages });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/projects/[id]/business">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "business-info", perHour: 120 } });
  if (!r.ok) return r.response;
  const body = await readJsonCapped(request, 8_000);
  if (body.tooLarge) return json(413, { error: "too_large" });
  const parsed = businessInfo.safeParse(body.value);
  if (!parsed.success) return json(400, { error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") });
  if (await blockedText(businessTexts(parsed.data), r.user.id, id, "business")) return json(422, { error: "blocked" });
  await services().siteSettings.saveBusiness(r.user.id, id, parsed.data);
  services().publicSites.invalidate(id);
  return json(200, { business: parsed.data });
}

import { json } from "@/lib/api/guard";
import { ownerRoute } from "@/lib/api/owner";
import { readJsonCapped } from "@/lib/api/body";
import { seoTexts } from "@/lib/site-info/owner-text";
import { blockedText } from "@/lib/site-info/save";
import { seoSettings } from "@/lib/site-info/seo";
import { services } from "@/lib/server/services";

/** The Google and share preview; it goes into the pages at the next publish. */
export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/seo">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: false });
  if (!r.ok) return r.response;
  return json(200, { seo: (await services().siteSettings.get(r.user.id, id)).seo ?? {} });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/projects/[id]/seo">) {
  const { id } = await ctx.params;
  const r = await ownerRoute(id, { mutating: true, limit: { name: "seo", perHour: 120 } });
  if (!r.ok) return r.response;
  const body = await readJsonCapped(request, 4_000);
  if (body.tooLarge) return json(413, { error: "too_large" });
  const parsed = seoSettings.safeParse(body.value);
  if (!parsed.success) return json(400, { error: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") });
  // Only the owner's own photos can be picked.
  const photos = new Set(((await r.builder.assets?.list(r.user.id, id)) ?? []).map((a) => a.name));
  if ((parsed.data.image && !photos.has(parsed.data.image)) || (parsed.data.icon && !photos.has(parsed.data.icon))) return json(400, { error: "invalid", field: "image" });
  if (await blockedText(seoTexts(parsed.data), r.user.id, id, "seo")) return json(422, { error: "blocked" });
  await services().siteSettings.saveSeo(r.user.id, id, parsed.data);
  return json(200, { seo: parsed.data });
}

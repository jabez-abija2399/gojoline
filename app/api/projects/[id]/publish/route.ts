import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { refreshTemplateUsage } from "@/lib/landing/template-usage";
import { publishInfo, publishSite } from "@/lib/publish/service";
import { services } from "@/lib/server/services";

export const maxDuration = 300;

async function setup(id: string, mutating: boolean) {
  if (!z.uuid().safeParse(id).success) return { error: json(404, { error: "not_found" }) } as const;
  const g = await guardBuilder({ mutating, limit: mutating ? { name: "publish", perHour: 20 } : undefined });
  if (!g.ok) return { error: g.response } as const;
  const deps = services().publish;
  const user = await currentUser();
  if (!deps || !user) return { error: json(503, { error: "unavailable" }) } as const;
  return { deps, user } as const;
}

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const { id } = await ctx.params;
  const s = await setup(id, false);
  if ("error" in s) return s.error;
  const info = await publishInfo(s.deps, s.user, id);
  return info ? json(200, info) : json(404, { error: "not_found" });
}

const body = z.object({ slug: z.string().trim().max(60) }).strict();

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/publish">) {
  const { id } = await ctx.params;
  const s = await setup(id, true);
  if ("error" in s) return s.error;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "slug_format" });
  const outcome = await publishSite(s.deps, s.user, id, parsed.data.slug);
  if (outcome.ok) refreshTemplateUsage();
  if (outcome.ok) return json(200, { url: outcome.site.url, slug: outcome.site.slug, publishedVersion: outcome.site.publishedVersion });
  // Scan details stay on the server; the owner gets a plain reason.
  if (outcome.issues) console.warn("publish blocked by scan", id, outcome.issues.map((i) => `${i.rule}:${i.file}`).join(","));
  const status = outcome.error === "not_found" ? 404 : outcome.error === "failed" ? 502 : 409;
  return json(status, { error: outcome.error });
}

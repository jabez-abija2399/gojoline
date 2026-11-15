import { z } from "zod";
import { json, guardBuilder } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { connectDomain, domainStatus } from "@/lib/publish/domains";
import { services } from "@/lib/server/services";

async function setup(id: string, mutating: boolean) {
  if (!z.uuid().safeParse(id).success) return { error: json(404, { error: "not_found" }) } as const;
  const g = await guardBuilder({ mutating, limit: { name: "domain", perHour: 30 } });
  if (!g.ok) return { error: g.response } as const;
  const deps = services().publish;
  const user = await currentUser();
  if (!deps || !user) return { error: json(503, { error: "unavailable" }) } as const;
  return { deps, user } as const;
}

export async function GET(_request: Request, ctx: RouteContext<"/api/projects/[id]/domain">) {
  const { id } = await ctx.params;
  const s = await setup(id, false);
  if ("error" in s) return s.error;
  const entitled = (await services().entitlements(s.user.id)).customDomain;
  const status = await domainStatus(s.deps, s.user.id, id);
  return json(200, { entitled, ...(status?.ok ? { domain: status.domain, status: status.status } : {}) });
}

const body = z.object({ domain: z.string().trim().max(253) }).strict();

export async function POST(request: Request, ctx: RouteContext<"/api/projects/[id]/domain">) {
  const { id } = await ctx.params;
  const s = await setup(id, true);
  if ("error" in s) return s.error;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "invalid_domain" });
  const r = await connectDomain({ ...s.deps, entitlements: services().entitlements }, s.user.id, id, parsed.data.domain);
  return r.ok ? json(200, { domain: r.domain, status: r.status }) : json(r.error === "failed" ? 502 : 409, { error: r.error });
}

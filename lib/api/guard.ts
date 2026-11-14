import "server-only";
import { NextResponse } from "next/server";
import { hasBuilderAccess, ownerId, sameOrigin } from "@/lib/builder/access";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";
import type { BuilderDeps } from "@/lib/builder/service";

export function json(status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

type Guarded = { ok: true; owner: string; builder: BuilderDeps } | { ok: false; response: NextResponse };

/** Access gate + CSRF check + rate limit for builder API routes. */
export async function guardBuilder(opts: { mutating: boolean; limit?: { name: string; perHour: number } }): Promise<Guarded> {
  if (opts.mutating && !(await sameOrigin())) return { ok: false, response: json(403, { error: "forbidden" }) };
  if (!(await hasBuilderAccess())) return { ok: false, response: json(401, { error: "access" }) };
  const builder = services().builder;
  if (!builder) return { ok: false, response: json(503, { error: "unavailable" }) };
  const owner = await ownerId(opts.mutating);
  if (!owner) return { ok: false, response: json(401, { error: "access" }) };
  if (opts.limit) {
    const override = Number(process.env.BUILDER_RATE_LIMIT_PER_HOUR);
    const max = override || opts.limit.perHour;
    const limiter = services().rateLimiter;
    const [byOwner, byIp] = await Promise.all([
      limiter.hit(`${opts.limit.name}:o:${owner}`, max, 3_600_000),
      limiter.hit(`${opts.limit.name}:ip:${await clientIp()}`, max * 3, 3_600_000),
    ]);
    if (!byOwner.allowed || !byIp.allowed) return { ok: false, response: json(429, { error: "too_many" }) };
  }
  return { ok: true, owner, builder };
}

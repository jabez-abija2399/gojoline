import { createHash } from "node:crypto";
import { z } from "zod";
import { json } from "@/lib/api/guard";
import { sameOrigin } from "@/lib/builder/access";
import { ipBucket } from "@/lib/cloud/submit";
import { addressCandidates } from "@/lib/safety/address";
import { REPORT_REASONS } from "@/lib/safety/reports";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

const body = z.object({
  site: z.string().trim().min(1).max(300),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(2000).optional(),
  contact: z.string().trim().max(200).optional(),
});

/** Anyone can report a site; no account needed. Limited per network so it can't be flooded. */
export async function POST(request: Request) {
  if (!(await sameOrigin())) return json(403, { error: "failed" });
  const svc = services();
  const moderation = svc.moderation;
  if (!moderation) return json(503, { error: "failed" });
  const network = ipBucket(await clientIp());
  const [hour, day] = await Promise.all([svc.rateLimiter.hit(`report:ip:${network}`, 10, 3_600_000), svc.rateLimiter.hit(`report:ipday:${network}`, 30, 86_400_000)]);
  if (!hour.allowed || !day.allowed) return json(429, { error: "too_many" });
  if (Number(request.headers.get("content-length") ?? 0) > 10_000) return json(413, { error: "failed" });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: parsed.error.issues.some((i) => i.path[0] === "reason") ? "reason" : "site" });

  const publisher = svc.publish?.publisher ?? null;
  let site = null;
  for (const address of addressCandidates(parsed.data.site, publisher ? (s) => publisher.urlFor(s) : null)) {
    site = await moderation.sites.byAddress(address);
    if (site) break;
  }
  if (!site || site.status === "pending") return json(404, { error: "site" });
  const salt = process.env.BETTER_AUTH_SECRET ?? "gojoline";
  await moderation.reports.add({
    siteId: site.id,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
    contact: parsed.data.contact || null,
    reporterKey: createHash("sha256").update(`${salt}:${network}`).digest("hex").slice(0, 32),
  });
  return json(201, { ok: true });
}

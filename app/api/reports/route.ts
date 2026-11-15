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
  const raw = await readCapped(request, 10_000);
  if (raw === null) return json(413, { error: "failed" });
  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    /* invalid JSON fails validation below */
  }
  const parsed = body.safeParse(data);
  if (!parsed.success) return json(400, { error: parsed.error.issues.some((i) => i.path[0] === "reason") ? "reason" : "site" });

  const publisher = svc.publish?.publisher ?? null;
  const site = await moderation.sites.byAddress(addressCandidates(parsed.data.site, publisher ? (s) => publisher.urlFor(s) : null));
  if (!site || site.status === "pending") return json(404, { error: "site" });
  if (!(await svc.rateLimiter.hit(`report:site:${site.id}`, 200, 86_400_000)).allowed) return json(201, { ok: true });
  // Production must have a real secret, or the stored key would be an unsalted hash of the network.
  const salt = process.env.BETTER_AUTH_SECRET || (process.env.NODE_ENV !== "production" || process.env.E2E === "1" ? "dev-only-salt" : undefined);
  if (!salt) return json(503, { error: "failed" });
  await moderation.reports.add({
    siteId: site.id,
    reason: parsed.data.reason,
    details: parsed.data.details || null,
    contact: parsed.data.contact || null,
    reporterKey: createHash("sha256").update(`${salt}:${network}`).digest("hex").slice(0, 32),
  });
  return json(201, { ok: true });
}

/** Reads at most `max` bytes of the body, whatever the headers claim; null when it is larger. */
async function readCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

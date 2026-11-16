import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { siteOrigins } from "@/lib/cloud/submit";
import type { PublicSite } from "@/lib/cloud/types";
import { addisDay } from "@/lib/dashboard/stats";
import type { RateLimiter } from "@/lib/rate-limit";
import { deviceOf, isBot, sourceOf } from "./classify";
import type { VisitCounter } from "./counter";

/** What the site's beacon sends (under 300 bytes): the page, where the visitor came from, and the site key. */
export const visitBody = z
  .object({
    path: z.string().max(120).regex(/^\//),
    ref: z.string().max(150),
    src: z.string().max(20).optional(),
    key: z.string().max(64).optional(),
  })
  .strict();

export const MAX_VISIT_BYTES = 300;

export interface VisitDeps {
  publicSite: (projectId: string) => Promise<PublicSite | null>;
  counter: VisitCounter;
  limiter: RateLimiter;
  now?: () => number;
}

export interface VisitInput {
  projectId: string;
  origin: string | null;
  /** From the X-Site-Key header, or `key` in the body (sendBeacon can't set headers). */
  siteKey: string | null;
  ip: string;
  userAgent: string;
  /** Sec-Fetch-Site: a beacon from the site itself is cross-site or same-site. */
  fetchSite: string | null;
  raw: string;
}

/** New people one address can add per site per day; views per site per day. */
export const MAX_PEOPLE_PER_IP = 5;
export const MAX_VIEWS_PER_DAY = 50_000;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const sameKey = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * One page view. The visitor is a hash of the day's random salt, the site, the IP and the
 * browser: the IP itself is never stored, and the salt (in Redis only) is gone after a day,
 * so yesterday's visitors can't be matched to today's. 204 for counted and quietly ignored.
 */
export async function recordVisit(deps: VisitDeps, input: VisitInput): Promise<{ status: number; allowOrigin: string | null; count?: () => Promise<void> }> {
  if (input.raw.length > MAX_VISIT_BYTES) return { status: 413, allowOrigin: null };
  const site = await deps.publicSite(input.projectId);
  if (!site || site.status !== "published") return { status: 404, allowOrigin: null };
  const allowOrigin = input.origin && siteOrigins(site).includes(input.origin) ? input.origin : null;
  if (!allowOrigin) return { status: 403, allowOrigin: null };
  let json: unknown = null;
  try {
    json = JSON.parse(input.raw);
  } catch {
    json = null;
  }
  const body = visitBody.safeParse(json);
  if (!body.success) return { status: 400, allowOrigin };
  const key = input.siteKey ?? body.data.key ?? "";
  if (!site.siteKey || !key || !sameKey(key, site.siteKey)) return { status: 403, allowOrigin };
  // Browsers say where a request came from; anything but another site (the published one) is ignored.
  if (input.fetchSite && input.fetchSite !== "cross-site" && input.fetchSite !== "same-site") return { status: 204, allowOrigin };
  if (site.offline || isBot(input.userAgent)) return { status: 204, allowOrigin };

  const now = (deps.now ?? Date.now)();
  const day = addisDay(now);
  const salt = await deps.counter.salt(day);
  // Rate limit per hashed IP (60 views a minute per site), never the IP in the clear.
  const ipHash = sha256(`${salt}:ip:${input.ip}`).slice(0, 24);
  const [perIp, perSite] = await Promise.all([deps.limiter.hit(`visit:${site.projectId}:${ipHash}`, 60, 60_000), deps.limiter.hit(`visit:day:${site.projectId}:${day}`, MAX_VIEWS_PER_DAY, 86_400_000)]);
  if (!perIp.allowed || !perSite.allowed) return { status: 429, allowOrigin };

  const visitorId = sha256(`${salt}${site.projectId}${input.ip}${input.userAgent}`);
  const own = siteOrigins(site).map((o) => new URL(o).hostname);
  const meta = { source: sourceOf(body.data.ref, body.data.src, own), device: deviceOf(input.userAgent), ip: ipHash, maxPerIp: MAX_PEOPLE_PER_IP };
  return { status: 204, allowOrigin, count: () => deps.counter.record(site.projectId, day, visitorId, meta) };
}

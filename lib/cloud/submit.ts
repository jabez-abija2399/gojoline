import { timingSafeEqual } from "node:crypto";
import type { RateLimiter } from "@/lib/rate-limit";
import { checkSubmission } from "./forms";
import type { CloudStore, PublicSite, SubmissionNotifier } from "./types";

export interface SubmitDeps {
  cloud: CloudStore;
  limiter: RateLimiter;
  notifier?: SubmissionNotifier;
  /** Per IP per site per minute (default 5) and per site per day (default 300). */
  limits?: { perIpPerMinute?: number; perSitePerDay?: number };
  /** Monthly answer allowance and Telegram notifications by the owner's plan. */
  entitlements?: (userId: string) => Promise<{ answersPerMonth: number; telegramNotify: boolean }>;
}

export interface SubmitInput {
  projectId: string;
  formKey: string;
  origin: string | null;
  siteKey: string | null;
  ip: string;
  body: unknown;
}

export interface SubmitResult {
  status: number;
  body: Record<string, unknown>;
  /** Echoed in Access-Control-Allow-Origin when the request came from the site itself. */
  allowOrigin: string | null;
}

/** Origins allowed to post: the site's published address and its own domain. */
export function siteOrigins(site: Pick<PublicSite, "url" | "customDomain">): string[] {
  const out: string[] = [];
  if (site.url) {
    try {
      out.push(new URL(site.url).origin);
    } catch {
      // ignore malformed stored URL
    }
  }
  if (site.customDomain) out.push(`https://${site.customDomain}`);
  return out;
}

/** IPv6 visitors usually control a whole /64, so they count as one. */
export function ipBucket(ip: string): string {
  if (!ip.includes(":")) return ip;
  const parts = ip.split("::")[0]!.split(":");
  return `${parts.slice(0, 4).join(":")}::/64`;
}

function sameKey(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function handleSubmission(deps: SubmitDeps, input: SubmitInput): Promise<SubmitResult> {
  const deny = (status: number, error: string, allowOrigin: string | null = null): SubmitResult => ({ status, body: { error }, allowOrigin });
  const site = await deps.cloud.publicSite(input.projectId);
  if (!site || site.status !== "published") return deny(404, "not_found");
  const origins = siteOrigins(site);
  const allowOrigin = input.origin && origins.includes(input.origin) ? input.origin : null;
  // Browsers always send Origin on cross-site POSTs; anything else isn't the site's own form.
  if (!allowOrigin) return deny(403, "origin");
  if (!site.siteKey || !input.siteKey || !sameKey(input.siteKey, site.siteKey)) return deny(403, "key", allowOrigin);

  const body = (input.body && typeof input.body === "object" ? input.body : {}) as Record<string, unknown>;
  // Bots fill the hidden field or submit instantly: accept silently, store nothing, and
  // don't let them use up the site's daily allowance.
  const elapsed = typeof body._ms === "number" ? body._ms : 0;
  if ((typeof body._hp === "string" && body._hp !== "") || elapsed < 1500) return { status: 200, body: { ok: true }, allowOrigin };

  const ip = ipBucket(input.ip);
  const perIp = deps.limits?.perIpPerMinute ?? 5;
  const perDay = deps.limits?.perSitePerDay ?? 300;
  const [byIp, byIpDay, bySite] = await Promise.all([
    deps.limiter.hit(`form:ip:${site.siteId}:${ip}`, perIp, 60_000),
    deps.limiter.hit(`form:ipday:${site.siteId}:${ip}`, 30, 86_400_000),
    deps.limiter.hit(`form:site:${site.siteId}`, perDay, 86_400_000),
  ]);
  if (!byIp.allowed || !byIpDay.allowed || !bySite.allowed) return deny(429, "too_many", allowOrigin);
  const plan = deps.entitlements ? await deps.entitlements(site.ownerId) : null;

  const form = await deps.cloud.getForm(site.siteId, input.formKey);
  if (!form) return deny(404, "form_not_found", allowOrigin);
  const checked = checkSubmission(form, body.answers);
  if (!checked.ok) return { status: 422, body: { error: "invalid", field: checked.field }, allowOrigin };
  if (plan && !(await deps.limiter.hit(`form:month:${site.siteId}`, plan.answersPerMonth, 30 * 86_400_000)).allowed) {
    return deny(429, "plan_limit", allowOrigin);
  }

  const lang = body.lang === "am" || body.lang === "en" ? body.lang : null;
  const submission = await deps.cloud.addSubmission({
    siteId: site.siteId,
    projectId: site.projectId,
    ownerId: site.ownerId,
    formKey: form.id,
    kind: form.kind,
    data: checked.data,
    lang,
  });
  if (plan?.telegramNotify ?? true) await deps.notifier?.notify(submission, form).catch((e: unknown) => console.error("notify failed", e instanceof Error ? e.message : "unknown"));
  return { status: 201, body: { ok: true }, allowOrigin };
}

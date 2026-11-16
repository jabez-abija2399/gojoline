import { z } from "zod";
import { PLAN_FEATURES, PLAN_IDS, TOPUP_CREDITS, type PlanFeatures, type PlanId } from "./plans";

/** How big an AI request is; bigger requests use more changes (credits). */
export const REQUEST_SIZES = ["small", "medium", "large"] as const;
export type RequestSize = (typeof REQUEST_SIZES)[number];

export const sizeRank = (s: RequestSize) => REQUEST_SIZES.indexOf(s);
export const biggerSize = (a: RequestSize, b: RequestSize): RequestSize => (sizeRank(a) >= sizeRank(b) ? a : b);

/** Default AI cost cap per change charged, in US cents (~3–5× the measured median edit). */
export const DEFAULT_CAP_CENTS_PER_CREDIT = 15;
/** A free first build has no change to measure against: its own cap, in US cents. */
export const FIRST_BUILD_CAP_CENTS = 40;
/** Fewer agent turns for smaller requests: a cheap safety net beside the cost cap. */
export const MAX_TURNS_BY_SIZE: Record<RequestSize | "first_build", number> = { small: 8, medium: 12, large: 16, first_build: 16 };

const int = (min: number, max: number) => z.number().int().min(min).max(max);

/**
 * Credit amounts admins can change in Admin → Settings without a deploy. Stored in
 * app_settings under "credits"; the defaults come from PLAN_FEATURES and the constants above.
 */
export const creditSettingsSchema = z
  .object({
    monthly: z.object({ free: int(0, 1000), starter: int(0, 10_000), business: int(0, 10_000) }).strict(),
    /** 1 = no rollover; n keeps up to n months' allowance of unused monthly changes. */
    rollover: z.object({ free: int(1, 12), starter: int(1, 12), business: int(1, 12) }).strict(),
    topupCredits: int(1, 1000),
    sizeCredits: z
      .object({ small: int(1, 10), medium: int(1, 20), large: int(1, 50) })
      .strict()
      .refine((s) => s.small <= s.medium && s.medium <= s.large, { message: "order", path: ["medium"] }),
    capCentsPerCredit: int(1, 500),
  })
  .strict();
export type CreditSettings = z.infer<typeof creditSettingsSchema>;

export function defaultCreditSettings(): CreditSettings {
  return {
    monthly: { free: PLAN_FEATURES.free.monthlyEdits, starter: PLAN_FEATURES.starter.monthlyEdits, business: PLAN_FEATURES.business.monthlyEdits },
    rollover: { free: PLAN_FEATURES.free.rolloverMonths, starter: PLAN_FEATURES.starter.rolloverMonths, business: PLAN_FEATURES.business.rolloverMonths },
    topupCredits: TOPUP_CREDITS,
    sizeCredits: { small: 1, medium: 2, large: 4 },
    capCentsPerCredit: DEFAULT_CAP_CENTS_PER_CREDIT,
  };
}

/** Saved values over the defaults; anything invalid falls back to the defaults as a whole. */
export function mergeCreditSettings(saved: Record<string, unknown> | null): CreditSettings {
  const base = defaultCreditSettings();
  if (!saved) return base;
  const obj = (v: unknown) => (v && typeof v === "object" ? (v as object) : {});
  const merged = {
    ...base,
    ...saved,
    monthly: { ...base.monthly, ...obj(saved.monthly) },
    rollover: { ...base.rollover, ...obj(saved.rollover) },
    sizeCredits: { ...base.sizeCredits, ...obj(saved.sizeCredits) },
  };
  const parsed = creditSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}

/** PLAN_FEATURES with the admin's monthly changes and rollover: what pages and limits use. */
export function planFeaturesWith(cs: CreditSettings): Record<PlanId, PlanFeatures> {
  return Object.fromEntries(PLAN_IDS.map((p) => [p, { ...PLAN_FEATURES[p], monthlyEdits: cs.monthly[p], rolloverMonths: cs.rollover[p] }])) as Record<PlanId, PlanFeatures>;
}

/** The AI cost cap for one request, in integer nano-USD (1 cent = 1e7 nano-USD). */
export function costCapNano(cs: CreditSettings, credits: number): number {
  return credits * cs.capCentsPerCredit * 10_000_000;
}

/** "0.15" or "1" US dollars → whole cents; null when not a price with at most 2 decimals. */
export function usdToCents(raw: string): number | null {
  const m = /^\$?\s*(\d{1,3})(?:\.(\d{1,2}))?$/.exec(raw.trim());
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
}

/** When the next monthly changes arrive: the first day of next month (UTC), as grants are monthly. */
export function nextMonthlyGrant(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

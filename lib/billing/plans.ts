import type { Entitlements } from "./entitlements";

/** Prices are integer minor units (santim) of ETB. Hypotheses from the PRD; easy to change here. */
export const PRODUCTS = {
  starter_month: { plan: "starter", period: "month", amountMinor: 39_900 },
  starter_year: { plan: "starter", period: "year", amountMinor: 399_900 },
  business_month: { plan: "business", period: "month", amountMinor: 99_900 },
  business_year: { plan: "business", period: "year", amountMinor: 999_900 },
  topup: { plan: null, period: null, amountMinor: 49_900 },
} as const;

export type Product = keyof typeof PRODUCTS;
export const TOPUP_CREDITS = 50;

export const PLAN_FEATURES: Record<Entitlements["plan"], Entitlements & { monthlyEdits: number; telegramEdits: boolean }> = {
  free: { plan: "free", customDomain: false, maxSites: 1, badge: true, monthlyEdits: 15, telegramEdits: false },
  starter: { plan: "starter", customDomain: true, maxSites: 1, badge: false, monthlyEdits: 50, telegramEdits: false },
  business: { plan: "business", customDomain: true, maxSites: 3, badge: false, monthlyEdits: 150, telegramEdits: true },
};

/** Unused monthly edits roll over, up to two months' worth. */
export const ROLLOVER_CAP_MONTHS = 2;

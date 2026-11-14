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

export const PLAN_FEATURES: Record<Entitlements["plan"], Entitlements & { monthlyEdits: number }> = {
  free: { plan: "free", customDomain: false, maxSites: 1, badge: true, telegramNotify: false, telegramEdits: false, answersPerMonth: 100, monthlyEdits: 15 },
  starter: { plan: "starter", customDomain: true, maxSites: 1, badge: false, telegramNotify: true, telegramEdits: false, answersPerMonth: 2000, monthlyEdits: 50 },
  business: { plan: "business", customDomain: true, maxSites: 3, badge: false, telegramNotify: true, telegramEdits: true, answersPerMonth: 10000, monthlyEdits: 150 },
};

/** Unused monthly edits roll over, up to two months' worth. */
export const ROLLOVER_CAP_MONTHS = 2;

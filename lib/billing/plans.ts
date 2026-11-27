import { FREE, MB, type Entitlements } from "./entitlements";

/**
 * Default prices in integer minor units (santim) of ETB. Admin → Settings overrides them
 * (lib/billing/settings.ts); these apply until an admin saves other prices.
 */
export const PRODUCTS = {
  starter_month: { plan: "starter", period: "month", amountMinor: 49_900 },
  starter_year: { plan: "starter", period: "year", amountMinor: 499_000 },
  business_month: { plan: "business", period: "month", amountMinor: 129_900 },
  business_year: { plan: "business", period: "year", amountMinor: 1_299_000 },
  topup: { plan: null, period: null, amountMinor: 24_900 },
} as const;

export type Product = keyof typeof PRODUCTS;
export type PlanId = Entitlements["plan"];
export type PaidPlan = Exclude<PlanId, "free">;

export const PLAN_IDS = ["free", "starter", "business"] as const satisfies readonly PlanId[];

/** AI changes added by one "Extra changes" payment. */
export const TOPUP_CREDITS = 30;

export interface PlanFeatures extends Entitlements {
  /** AI changes added each month. */
  monthlyEdits: number;
  /** Unused changes are kept up to this many months' allowance (1 = no rollover). */
  rolloverMonths: number;
  /** Help with the owner's own domain: none, a step-by-step guide, or we connect it. */
  domainHelp: "none" | "guide" | "done_for_you";
  support: "channel" | "chat" | "priority";
  /** On every plan; listed so the comparison table says so. */
  ownerDashboard: true;
  bilingualSites: true;
  allTemplates: true;
  freeAddress: true;
}

const everyPlan = { ownerDashboard: true, bilingualSites: true, allTemplates: true, freeAddress: true } as const;

/** The one source of truth for what each plan includes (limits, pricing page, Plan page, admin). */
export const PLAN_FEATURES: Record<PlanId, PlanFeatures> = {
  free: { ...FREE, ...everyPlan, monthlyEdits: 10, rolloverMonths: 1, domainHelp: "none", support: "channel" },
  starter: {
    ...everyPlan,
    plan: "starter",
    maxSites: 1,
    monthlyEdits: 50,
    rolloverMonths: 2,
    customDomain: true,
    domainHelp: "guide",
    badge: false,
    answersPerMonth: 2_000,
    telegramNotify: true,
    telegramEdits: false,
    storageBytes: 500 * MB,
    siteDownload: false,
    support: "chat",
  },
  business: {
    ...everyPlan,
    plan: "business",
    maxSites: 3,
    monthlyEdits: 150,
    rolloverMonths: 2,
    customDomain: true,
    domainHelp: "done_for_you",
    badge: false,
    answersPerMonth: 10_000,
    telegramNotify: true,
    telegramEdits: true,
    storageBytes: 2048 * MB,
    siteDownload: true,
    support: "priority",
  },
};

/** The limits the server enforces, without the display-only fields. */
export function entitlementsOf(plan: PlanId): Entitlements {
  const f = PLAN_FEATURES[plan];
  return { plan: f.plan, customDomain: f.customDomain, maxSites: f.maxSites, badge: f.badge, telegramNotify: f.telegramNotify, telegramEdits: f.telegramEdits, answersPerMonth: f.answersPerMonth, storageBytes: f.storageBytes, siteDownload: f.siteDownload };
}

/** What a year costs compared with twelve months, in santim (never negative). */
export function yearlySaving(monthMinor: number, yearMinor: number): number {
  return Math.max(0, monthMinor * 12 - yearMinor);
}

/** Whole months a yearly price saves (rounded down), e.g. 2 for 4,990 vs 499 a month. */
export function monthsFree(monthMinor: number, yearMinor: number): number {
  return monthMinor > 0 ? Math.floor(yearlySaving(monthMinor, yearMinor) / monthMinor) : 0;
}

/** "50 MB", "500 MB", "2 GB": storage sizes as people say them. */
export function storageLabel(bytes: number): string {
  return bytes >= 1024 * MB && bytes % (1024 * MB) === 0 ? `${bytes / (1024 * MB)} GB` : `${Math.round(bytes / MB)} MB`;
}

/** "499" or "499.50" Birr (commas allowed) → santim, without floating point; null when not a price. */
export function birrToMinor(raw: string): number | null {
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(raw.trim().replace(/,/g, ""));
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
}

/** A product's name from the messages; the top-up name carries {n}, the changes in one pack (Admin → Settings). */
export function productName(names: Record<Product, string>, product: Product, topupCredits: number = TOPUP_CREDITS): string {
  return names[product].replace("{n}", String(topupCredits));
}

import { offerPrice, type LaunchOffer } from "./discounts";
import type { PaidPlan, PlanFeatures, PlanId, Product } from "./plans";

/** One thing the "no changes left" dialog offers: a plan's month or a top-up pack. */
export interface UpgradeChoice {
  product: Product;
  /** The plan it moves the owner to; null for a top-up. */
  plan: PaidPlan | null;
  /** AI changes a month (plans) or in the pack (top-up). */
  changes: number;
  /** What it costs now, in santim (the launch offer included). */
  priceMinor: number;
  /** The usual price when an offer lowers it, else null. */
  wasMinor: number | null;
}

/**
 * What helps an owner who has run out, best first (the first one is the coral button):
 * Free → Starter, Business; Starter → a top-up, Business; Business → a top-up.
 */
export function upgradeChoices(
  plan: PlanId,
  opts: { prices: Record<Product, number>; offer: LaunchOffer | null; now: Date; features: Record<PlanId, PlanFeatures>; topupCredits: number },
): UpgradeChoice[] {
  const products: Product[] = plan === "free" ? ["starter_month", "business_month"] : plan === "starter" ? ["topup", "business_month"] : ["topup"];
  return products.map((product) => {
    const base = opts.prices[product];
    const offered = offerPrice(opts.offer, product, base, opts.now);
    const toPlan: PaidPlan | null = product === "topup" ? null : product === "starter_month" ? "starter" : "business";
    return {
      product,
      plan: toPlan,
      changes: toPlan ? opts.features[toPlan].monthlyEdits : opts.topupCredits,
      priceMinor: offered ?? base,
      wasMinor: offered !== null && offered < base ? base : null,
    };
  });
}

/** Where a choice leads: the Plan page's payment form with that product already chosen. */
export function upgradeHref(locale: string, product: Product): string {
  return `/${locale}/billing?product=${product}#pay-title`;
}

/** "2026-11" in Addis Ababa time (UTC+3, no daylight saving): the month a dismissal counts for. */
export function upgradeMonth(now: Date): string {
  const addis = new Date(now.getTime() + 3 * 3_600_000);
  return `${addis.getUTCFullYear()}-${String(addis.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Why the dialog might open: a refused request, a send at 0, or a run that just used the last change. */
export type UpgradeTrigger = "refused" | "send" | "after_run";

/**
 * Whether the "no changes left" dialog opens. A refusal or a send at 0 always opens it (the owner
 * just asked for something we can't do); a run that took the balance to 0 opens it once a month,
 * so it never nags on every page load or every run.
 */
export function shouldOpenUpgrade(
  trigger: UpgradeTrigger,
  s: { before: number | null; after: number | null; hasSite: boolean; dismissedMonth: string | null; month: string },
): boolean {
  if (s.after === null || s.after > 0) return false;
  switch (trigger) {
    case "refused":
      return true;
    case "send":
      // A new site's first build is free even at 0: let it through.
      return s.hasSite;
    case "after_run":
      return s.before !== null && s.before > 0 && s.dismissedMonth !== s.month;
  }
}

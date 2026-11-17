import { offerPrice, type LaunchOffer } from "./offer-math";
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

export { shouldOpenUpgrade, upgradeMonth, type UpgradeTrigger } from "./upgrade-rules";

import { format } from "@/lib/i18n/format";
import { offerUntilLabel, type LaunchOffer } from "./discounts";
import { productName, type Product } from "./plans";

type Locale = "en" | "am";

/** The offer's name for customers: its own name in this language, or the default ("Launch offer"). */
export function offerName(offer: Pick<LaunchOffer, "name">, locale: Locale, fallback: string): string {
  return offer.name?.[locale] ?? fallback;
}

/** "Launch offer: 20% off until 31 Dec", or "Launch offer: 20% off" when it has no last day. */
export function offerBadgeText(offer: LaunchOffer, locale: Locale, m: { offerName: string; offerBadge: string; offerBadgeOpen: string }): string {
  const name = offerName(offer, locale, m.offerName);
  const date = offerUntilLabel(offer, locale);
  return date ? format(m.offerBadge, { name, percent: offer.percent, date }) : format(m.offerBadgeOpen, { name, percent: offer.percent });
}

/**
 * The products an offer covers, short: a plan whose month and year are both included reads as the
 * plan ("Starter and Business"), otherwise each product by name.
 */
export function offerProductsText(
  products: readonly Product[],
  locale: Locale,
  names: { plans: Record<"starter" | "business", string>; productNames: Record<Product, string> },
  topupCredits: number,
): string {
  const parts: string[] = [];
  for (const plan of ["starter", "business"] as const) {
    const month = products.includes(`${plan}_month`);
    const year = products.includes(`${plan}_year`);
    if (month && year) parts.push(names.plans[plan]);
    else if (month) parts.push(productName(names.productNames, `${plan}_month`));
    else if (year) parts.push(productName(names.productNames, `${plan}_year`));
  }
  if (products.includes("topup")) parts.push(productName(names.productNames, "topup", topupCredits));
  return new Intl.ListFormat(locale === "am" ? "am" : "en", { type: "conjunction" }).format(parts);
}

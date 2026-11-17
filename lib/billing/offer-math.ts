import type { Product } from "./plans";

// Price arithmetic for codes and the launch offer, without the input schemas (zod stays on the
// server; the builder and the Plan page import from here).

/** A discount code as admins make it. Exactly one of percentOff or amountOffMinor is set. */
export interface DiscountCode {
  id: string;
  code: string;
  percentOff: number | null;
  amountOffMinor: number | null;
  products: Product[];
  maxUses: number | null;
  uses: number;
  expiresAt: Date | null;
  firstPaymentOnly: boolean;
  /** Each customer can use it once (approved payments count). */
  perCustomerOnce: boolean;
  active: boolean;
  createdAt: Date;
}

/** The site-wide offer as saved (validated by `launchOfferSchema` in discounts.ts). */
export interface LaunchOffer {
  active: boolean;
  percent: number;
  products: Product[];
  /** Last day of the offer (YYYY-MM-DD, Addis Ababa time); absent: no end date. */
  until?: string;
  name?: { en: string; am: string };
}

/** The moment an offer ends: the end of its last day in Addis Ababa (UTC+3, no daylight saving); null without a last day. */
export function offerEndsAt(offer: Pick<LaunchOffer, "until">): Date | null {
  return offer.until ? new Date(`${offer.until}T23:59:59.999+03:00`) : null;
}

export function offerApplies(offer: LaunchOffer | null, product: Product, now: Date): offer is LaunchOffer {
  if (!offer || !offer.active || !offer.products.includes(product)) return false;
  const end = offerEndsAt(offer);
  return end === null || now <= end;
}

/** Minimum price after any discount: 1 Birr. */
export const MIN_PRICE_MINOR = 100;

/**
 * The price after taking `offMinor` off, rounded down to whole Birr (customers never pay more
 * than the advertised discount) and never below 1 Birr. A base price under 1 Birr is left alone.
 */
export function discounted(baseMinor: number, offMinor: number): { finalMinor: number; discountMinor: number } {
  if (offMinor <= 0 || baseMinor <= MIN_PRICE_MINOR) return { finalMinor: baseMinor, discountMinor: 0 };
  const raw = baseMinor - offMinor;
  const finalMinor = Math.max(MIN_PRICE_MINOR, Math.floor(raw / 100) * 100);
  return { finalMinor, discountMinor: baseMinor - finalMinor };
}

/** Santim off for a percentage, in integers only (the final price is rounded later). */
export const percentOffMinor = (baseMinor: number, percent: number) => Math.floor((baseMinor * percent) / 100);


export interface Quote {
  product: Product;
  originalMinor: number;
  finalMinor: number;
  discountMinor: number;
  /** Which discount applied; launch offer and code don't stack, the better one wins. */
  source: "offer" | "code" | null;
  code: string | null;
}

/** The price to pay: the better of the launch offer and a (valid) code; they never stack. */
export function quote(product: Product, baseMinor: number, opts: { offer: LaunchOffer | null; code: DiscountCode | null; now: Date }): Quote {
  const fromOffer = offerApplies(opts.offer, product, opts.now) ? discounted(baseMinor, percentOffMinor(baseMinor, opts.offer.percent)) : null;
  const c = opts.code;
  const fromCode = c ? discounted(baseMinor, c.percentOff !== null ? percentOffMinor(baseMinor, c.percentOff) : (c.amountOffMinor ?? 0)) : null;
  const none: Quote = { product, originalMinor: baseMinor, finalMinor: baseMinor, discountMinor: 0, source: null, code: null };
  // Ties go to the offer: the code then stays unused for a later payment.
  if (fromCode && fromCode.discountMinor > 0 && fromCode.discountMinor > (fromOffer?.discountMinor ?? 0)) {
    return { ...none, ...fromCode, source: "code", code: c!.code };
  }
  if (fromOffer && fromOffer.discountMinor > 0) return { ...none, ...fromOffer, source: "offer" };
  return none;
}

/** The launch-offer price of a product now, or null when the offer doesn't apply to it. */
export function offerPrice(offer: LaunchOffer | null, product: Product, baseMinor: number, now: Date): number | null {
  const q = quote(product, baseMinor, { offer, code: null, now });
  return q.source === "offer" ? q.finalMinor : null;
}

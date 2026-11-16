import { z } from "zod";
import { PRODUCTS, type Product } from "./plans";

export const PRODUCT_IDS = Object.keys(PRODUCTS) as Product[];

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

/** At least 6 characters, so codes can't be guessed by trying short ones. */
export const CODE_PATTERN = /^[A-Z0-9]{6,20}$/;

/** Codes are typed in any case, with stray spaces; stored and compared in upper case. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

const productList = z.array(z.enum(PRODUCT_IDS as [Product, ...Product[]])).min(1).max(PRODUCT_IDS.length).refine((l) => new Set(l).size === l.length);

/** What an admin fills in to make a code (money in santim, whole Birr for fixed amounts). */
export const discountInputSchema = z
  .object({
    code: z.string().transform(normalizeCode).pipe(z.string().regex(CODE_PATTERN)),
    kind: z.enum(["percent", "amount"]),
    percentOff: z.number().int().min(1).max(90).nullable(),
    amountOffMinor: z.number().int().min(100).max(10_000_000).multipleOf(100).nullable(),
    products: productList,
    maxUses: z.number().int().min(1).max(100_000).nullable(),
    expiresAt: z.date().nullable(),
    firstPaymentOnly: z.boolean(),
    perCustomerOnce: z.boolean(),
  })
  .strict()
  .refine((d) => (d.kind === "percent" ? d.percentOff !== null && d.amountOffMinor === null : d.amountOffMinor !== null && d.percentOff === null), { path: ["kind"] });
export type DiscountInput = z.infer<typeof discountInputSchema>;

/** The site-wide launch offer (app_settings "offer"): a percentage off chosen products until a date. */
export const launchOfferSchema = z
  .object({
    active: z.boolean(),
    percent: z.number().int().min(1).max(90),
    products: productList,
    /** Last day of the offer (YYYY-MM-DD, Addis Ababa time). */
    until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();
export type LaunchOffer = z.infer<typeof launchOfferSchema>;

/** The moment an offer ends: the end of its last day in Addis Ababa (UTC+3, no daylight saving). */
export function offerEndsAt(offer: Pick<LaunchOffer, "until">): Date {
  return new Date(`${offer.until}T23:59:59.999+03:00`);
}

export function offerApplies(offer: LaunchOffer | null, product: Product, now: Date): offer is LaunchOffer {
  return !!offer && offer.active && offer.products.includes(product) && now <= offerEndsAt(offer);
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

export type CodeProblem = "not_found" | "inactive" | "expired" | "product" | "used_up" | "first_only" | "already_used";

/**
 * Whether a code can be used for this product now; null when it can. `usedByCustomer`: this
 * customer already has an approved payment with the code.
 */
export function codeProblem(code: DiscountCode | null, product: Product, now: Date, hasApprovedPayment: boolean, usedByCustomer = false): CodeProblem | null {
  if (!code) return "not_found";
  if (!code.active) return "inactive";
  if (code.expiresAt && code.expiresAt <= now) return "expired";
  if (!code.products.includes(product)) return "product";
  if (code.maxUses !== null && code.uses >= code.maxUses) return "used_up";
  if (code.firstPaymentOnly && hasApprovedPayment) return "first_only";
  if (code.perCustomerOnce && usedByCustomer) return "already_used";
  return null;
}

/** What the customer is told: unknown, switched-off and ended codes all read "not found" (no guessing which exist). */
export function publicCodeProblem(p: CodeProblem): CodeProblem {
  return p === "inactive" || p === "expired" ? "not_found" : p;
}

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

/** "31 Dec" (or the Amharic month), for "20% off until …". */
export function offerUntilLabel(offer: LaunchOffer, locale: "en" | "am"): string {
  return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { day: "numeric", month: "short", timeZone: "Africa/Addis_Ababa" }).format(offerEndsAt(offer));
}

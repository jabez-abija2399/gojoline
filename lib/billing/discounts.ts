import { z } from "zod";
import { PRODUCTS, type Product } from "./plans";
import { offerEndsAt, type DiscountCode, type LaunchOffer } from "./offer-math";

export * from "./offer-math";

export const PRODUCT_IDS = Object.keys(PRODUCTS) as Product[];

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

/** A name customers see instead of "Launch offer", e.g. "Holiday offer" (plain text, one line). */
const offerNameText = z.string().trim().min(1).max(40).regex(/^[^<>\n\r]*$/);

/**
 * The site-wide offer (app_settings "offer"): a percentage off chosen products. With `until` it
 * ends after that day; without it, it runs until an admin switches it off. `name` (both languages,
 * or neither) replaces the default "Launch offer" wording on public pages.
 */
export const launchOfferSchema = z
  .object({
    active: z.boolean(),
    percent: z.number().int().min(1).max(90),
    products: productList,
    /** Last day of the offer (YYYY-MM-DD, Addis Ababa time); absent: no end date. */
    until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    name: z.object({ en: offerNameText, am: offerNameText }).strict().optional(),
  })
  .strict();
// The schema's type is the plain interface in offer-math.ts (checked both ways at compile time).
type SchemaOffer = z.infer<typeof launchOfferSchema>;
const _sameOffer: [SchemaOffer extends LaunchOffer ? true : false, LaunchOffer extends SchemaOffer ? true : false] = [true, true];
void _sameOffer;

/** What the offer form saves: everything but on/off, which only the switch changes. */
export const launchOfferTermsSchema = launchOfferSchema.omit({ active: true });
export type LaunchOfferTerms = z.infer<typeof launchOfferTermsSchema>;

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

/** "31 Dec" (or the Amharic month), for "20% off until …"; null when the offer has no last day. */
export function offerUntilLabel(offer: LaunchOffer, locale: "en" | "am"): string | null {
  const end = offerEndsAt(offer);
  return end ? new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { day: "numeric", month: "short", timeZone: "Africa/Addis_Ababa" }).format(end) : null;
}

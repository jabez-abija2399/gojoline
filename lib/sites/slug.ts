/** Public address part of a site: lowercase letters, numbers and dashes, 3–40 characters. */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

/** The address the landing page shows as an example. Reserved, so no one can claim it. */
export const EXAMPLE_SLUG = "your-business";

const RESERVED = new Set([
  "www", "api", "app", "admin", "mail", "gojoline", "gojo", "support", "help", "login", "signin", "account",
  "billing", "pay", "payment", "secure", "bank", "telebirr", "cbe", "ethiotelecom", "safaricom", "status", "docs",
  "dashboard", "static", "assets", "cdn", "test", "root", "official", "verify", "update",
]);

/** Banks, telecoms and payment brands people could be tricked by, matched inside words too. */
const BRANDS = new Set([
  "gojoline", "telebirr", "ethiotelecom", "safaricom", "mpesa", "cbebirr", "commercialbank", "dashen", "awash",
  "abyssinia", "bunna", "zemen", "nibbank", "wegagen", "hibret", "chapa", "paypal", "visa", "mastercard",
]);

export type SlugProblem = "format" | "reserved";

export function checkSlug(slug: string): SlugProblem | null {
  if (!SLUG_RE.test(slug) || slug.includes("--")) return "format";
  // Reserved words anywhere (as a dash-separated part, or inside longer words for brand names).
  const parts = slug.split("-");
  // Shown as the example address on the landing page: nobody may publish there.
  if (slug === EXAMPLE_SLUG) return "reserved";
  if (parts.some((p) => RESERVED.has(p)) || [...BRANDS].some((b) => slug.includes(b))) return "reserved";
  return null;
}

/** A starting suggestion from the business name (Latin letters only; Amharic names get a fallback). */
export function suggestSlug(name: string, fallback: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return checkSlug(base) === null ? base : fallback;
}

/** Public address part of a site: lowercase letters, numbers and dashes, 3–40 characters. */
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

const RESERVED = new Set([
  "www", "api", "app", "admin", "mail", "gojoline", "gojo", "support", "help", "login", "signin", "account",
  "billing", "pay", "payment", "secure", "bank", "telebirr", "cbe", "ethiotelecom", "safaricom", "status", "docs",
  "dashboard", "static", "assets", "cdn", "test", "root", "official", "verify", "update",
]);

export type SlugProblem = "format" | "reserved";

export function checkSlug(slug: string): SlugProblem | null {
  if (!SLUG_RE.test(slug) || slug.includes("--")) return "format";
  if (RESERVED.has(slug) || [...RESERVED].some((r) => r.length > 3 && slug.startsWith(`${r}-`))) return "reserved";
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

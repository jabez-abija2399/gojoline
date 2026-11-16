/**
 * Where the site lives. "" for a real site (its own domain); "/demo/<id>" when Gojoline shows a
 * template as a live demo inside its own pages. Set by the build (Vite `base`); never by content.
 */
export const BASE = (import.meta.env?.BASE_URL ?? "/").replace(/\/$/, "");

/** A root path ("/menu", "/stock/x.webp") under the site's base. Other links are left alone. */
export function withBase(path: string): string {
  return BASE && path.startsWith("/") && !path.startsWith("//") ? `${BASE}${path}` : path;
}

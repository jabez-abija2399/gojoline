/**
 * Every cookie the app sets is `__Host-` in production (Secure, Path=/, no Domain): published
 * sites live on sibling subdomains (`<name>.afridea.et`) and afridea.et is not on the Public
 * Suffix List, so without the prefix a site could set a cookie for the whole domain that the
 * app would then read. Browsers refuse a `__Host-` cookie that has a Domain or comes from
 * another host. Development (plain http) keeps the plain names. Same rule as the login cookies
 * (lib/auth/config.ts). `NODE_ENV` is inlined in client bundles, so both sides agree.
 */
export const COOKIE_BASES = {
  theme: "gojo_theme",
  lang: "gojo_lang",
  attribution: "gojo_src",
  adminTheme: "gojo_admin_theme",
  tiktokState: "gojo_tiktok_state",
} as const;

export type CookieKey = keyof typeof COOKIE_BASES;

export const hostCookies = () => process.env.NODE_ENV === "production";

/** The cookie's name as set and read now. */
export function cookieName(key: CookieKey, secure = hostCookies()): string {
  return secure ? `__Host-${COOKIE_BASES[key]}` : COOKIE_BASES[key];
}

/** The attributes a `__Host-` cookie needs (merged into each set call). */
export function cookieAttrs(secure = hostCookies()): { path: "/"; secure: boolean } {
  return { path: "/", secure };
}

/** Reads the cookie, falling back once to the old plain name (set before 2026-11-27). */
export function readCookie(get: (name: string) => string | undefined, key: CookieKey): string | undefined {
  return get(cookieName(key)) ?? get(COOKIE_BASES[key]);
}

import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { AUTH_COOKIE_PREFIX, authCookiePrefix } from "./config";

/**
 * Whether this visitor carries a session cookie: a hint for marketing pages, read without a
 * database call so the landing page stays fast. Never use it to grant access (an expired
 * cookie still counts); pages behind it check the real session and send to sign-in.
 */
export async function looksSignedIn(): Promise<boolean> {
  // Same prefix as the auth setup (lib/auth/config.ts: advanced.cookiePrefix).
  const h = await headers();
  // On https only the __Host- cookie counts (a sibling site could plant the plain one).
  const secure = process.env.NODE_ENV === "production" && process.env.E2E !== "1";
  return !!getSessionCookie(h, { cookiePrefix: secure ? authCookiePrefix(true) : AUTH_COOKIE_PREFIX });
}

import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { AUTH_COOKIE_PREFIX } from "./config";

/**
 * Whether this visitor carries a session cookie: a hint for marketing pages, read without a
 * database call so the landing page stays fast. Never use it to grant access (an expired
 * cookie still counts); pages behind it check the real session and send to sign-in.
 */
export async function looksSignedIn(): Promise<boolean> {
  // Same prefix as the auth setup (lib/auth/config.ts: advanced.cookiePrefix).
  return !!getSessionCookie(await headers(), { cookiePrefix: AUTH_COOKIE_PREFIX });
}

import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * Temporary gate until accounts exist (Slice 2): the builder spends AI credits, so it is
 * closed in production unless BUILDER_ACCESS_CODE is set and the visitor entered it.
 * Owners are identified by an anonymous httpOnly cookie for now.
 */
export const ACCESS_COOKIE = "gojo_access";
export const OWNER_COOKIE = "gojo_uid";

function digest(code: string): string {
  return createHash("sha256").update(`gojoline-builder:${code}`).digest("base64url");
}

export function builderOpen(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.E2E === "1" || (env.NODE_ENV !== "production" && !env.BUILDER_ACCESS_CODE);
}

export function checkAccessCode(input: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const code = env.BUILDER_ACCESS_CODE;
  if (!code || input.length > 200) return null;
  const a = Buffer.from(digest(input));
  const b = Buffer.from(digest(code));
  return a.length === b.length && timingSafeEqual(a, b) ? digest(code) : null;
}

export async function hasBuilderAccess(): Promise<boolean> {
  if (builderOpen()) return true;
  const code = process.env.BUILDER_ACCESS_CODE;
  if (!code) return false;
  const value = (await cookies()).get(ACCESS_COOKIE)?.value ?? "";
  const a = Buffer.from(value);
  const b = Buffer.from(digest(code));
  return a.length === b.length && timingSafeEqual(a, b);
}

const cookieBase = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };

export async function grantAccess(token: string) {
  (await cookies()).set(ACCESS_COOKIE, token, { ...cookieBase, secure: process.env.NODE_ENV === "production" });
}

/** Anonymous owner id (replaced by the signed-in user id in Slice 2). */
export async function ownerId(create = false): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(OWNER_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
  if (!create) return null;
  const id = randomUUID();
  jar.set(OWNER_COOKIE, id, { ...cookieBase, secure: process.env.NODE_ENV === "production" });
  return id;
}

/** Rejects cross-site requests to mutating API routes (CSRF). */
export async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

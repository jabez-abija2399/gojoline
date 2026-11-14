import "server-only";
import { headers } from "next/headers";
import { currentUser } from "@/lib/auth/session";

/** The builder needs a signed-in account (Better Auth session). */
export async function hasBuilderAccess(): Promise<boolean> {
  return (await currentUser()) !== null;
}

/** Owner id for tenant scoping: the signed-in user's id. */
export async function ownerId(): Promise<string | null> {
  return (await currentUser())?.id ?? null;
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

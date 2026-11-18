import "server-only";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import type { OtpSender } from "@/lib/providers/notify/otp";
import { pickOtpSender } from "@/lib/providers/notify/pick";
import { createAuth } from "./config";

const env = process.env;
const production = env.NODE_ENV === "production" && env.E2E !== "1";

export const otpSender: OtpSender = pickOtpSender();

/** Google sign-in is on when both keys are set. */
export const googleAuth = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } : null;

type Auth = ReturnType<typeof createAuth>;
const g = globalThis as unknown as { gojoAuth?: Auth | null; gojoAuthMemory?: Record<string, unknown[]> };

/**
 * The Better Auth instance, created on first use. Null in production when DATABASE_URL or
 * BETTER_AUTH_SECRET is missing: accounts are then simply unavailable (never insecure defaults).
 */
export function getAuth(): Auth | null {
  if (g.gojoAuth !== undefined) return g.gojoAuth;
  const db = getDb();
  const secretOk = !!env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length >= 32;
  if (production && (!db || !secretOk)) {
    console.error("Accounts disabled: DATABASE_URL and BETTER_AUTH_SECRET (32+ chars) are required in production");
    g.gojoAuth = null;
    return null;
  }
  let database;
  if (db) {
    database = drizzleAdapter(db, {
      provider: "pg",
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    });
  } else {
    // Development / e2e only.
    g.gojoAuthMemory ??= { user: [], session: [], account: [], verification: [] };
    database = memoryAdapter(g.gojoAuthMemory as Parameters<typeof memoryAdapter>[0]);
  }
  g.gojoAuth = createAuth({
    database,
    secret: secretOk ? env.BETTER_AUTH_SECRET! : "dev-only-secret-not-for-production-use-0000",
    baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    secureCookies: production,
    sender: otpSender,
    google: googleAuth,
    extraPlugins: [nextCookies()],
    // Loaded when needed: services() is heavy and imports more than sign-in pages use.
    onUserCreated: async (user, headers) => (await import("@/lib/growth/signup")).onSignup(user, headers),
  });
  return g.gojoAuth;
}

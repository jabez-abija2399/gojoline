import "server-only";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies } from "better-auth/next-js";
import { createAuth } from "./config";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { DevOtpSender, UnavailableOtpSender, type OtpSender } from "@/lib/providers/notify/otp";

const env = process.env;
const production = env.NODE_ENV === "production" && env.E2E !== "1";

export const otpSender: OtpSender = production ? new UnavailableOtpSender() : new DevOtpSender();


function database() {
  const db = getDb();
  if (db) {
    return drizzleAdapter(db, {
      provider: "pg",
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    });
  }
  if (production) throw new Error("DATABASE_URL is required in production");
  // Development / e2e only.
  const g = globalThis as unknown as { gojoAuthMemory?: Record<string, unknown[]> };
  g.gojoAuthMemory ??= { user: [], session: [], account: [], verification: [] };
  return memoryAdapter(g.gojoAuthMemory as Parameters<typeof memoryAdapter>[0]);
}

function secret(): string {
  if (env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length >= 32) return env.BETTER_AUTH_SECRET;
  if (production) throw new Error("BETTER_AUTH_SECRET (32+ characters) is required in production");
  return "dev-only-secret-not-for-production-use-0000";
}

export const auth = createAuth({
  database: database(),
  secret: secret(),
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  secureCookies: production,
  sender: otpSender,
  extraPlugins: [nextCookies()],
});

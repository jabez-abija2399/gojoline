import "server-only";
import { neon } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { gojoDb?: Database | null };

/** Neon over HTTP (serverless-friendly). Null when DATABASE_URL is not set (dev/e2e fall back to memory). */
export function getDb(env: NodeJS.ProcessEnv = process.env): Database | null {
  if (globalForDb.gojoDb !== undefined) return globalForDb.gojoDb;
  globalForDb.gojoDb = env.DATABASE_URL ? (drizzle(neon(env.DATABASE_URL), { schema }) as unknown as Database) : null;
  return globalForDb.gojoDb;
}

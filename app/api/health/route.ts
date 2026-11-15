import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** The database is asked at most every 20 s, so this URL can't keep it awake or cost money. */
const TTL_MS = 20_000;
const cached = globalThis as unknown as { gojoHealth?: { ok: boolean; at: number }; gojoHealthCheck?: Promise<boolean> };

/** One database probe at a time, given up after 2 s. */
function probe(): Promise<boolean> {
  const db = getDb();
  if (!db) return Promise.resolve(true);
  cached.gojoHealthCheck ??= Promise.race([
    db.execute(sql`select 1`).then(() => true, () => false),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)),
  ]).finally(() => {
    cached.gojoHealthCheck = undefined;
  });
  return cached.gojoHealthCheck;
}

/** For uptime checks: 200 when the app and its database answer, 503 otherwise. Reveals nothing else. */
export async function GET() {
  const now = Date.now();
  if (!cached.gojoHealth || now - cached.gojoHealth.at > TTL_MS) cached.gojoHealth = { ok: await probe(), at: now };
  const { ok } = cached.gojoHealth;
  return Response.json({ ok }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}

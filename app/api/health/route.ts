import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** For uptime checks: 200 when the app and its database answer, 503 otherwise. Reveals nothing else. */
export async function GET() {
  const db = getDb();
  let database: "ok" | "down" | "none" = "none";
  if (db) {
    try {
      await db.execute(sql`select 1`);
      database = "ok";
    } catch {
      database = "down";
    }
  }
  const ok = database !== "down";
  return Response.json({ ok, database }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}

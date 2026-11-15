import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

/** A fresh in-process Postgres with all migrations applied. */
export async function testDb(): Promise<Database> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "lib/db/migrations" });
  return db as unknown as Database;
}

export async function makeUser(db: Database, id: string) {
  await db.insert(schema.user).values({ id, name: id, email: `${id}@example.com` });
  return id;
}

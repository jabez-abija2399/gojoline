import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { user } from "@/lib/db/schema";
import { makeUser, testDb } from "@/test/db";
import { DbSignupSourceStore, MemorySignupSourceStore } from "./sources";

describe("DbSignupSourceStore (PGlite)", () => {
  let db: Database;
  let store: DbSignupSourceStore;
  beforeEach(async () => {
    db = await testDb();
    store = new DbSignupSourceStore(db);
  });

  it("records the first touch once and counts sign-ups by source over 7 and 30 days", async () => {
    const now = new Date();
    for (const id of ["a", "b", "c", "d", "old"]) await makeUser(db, id);
    await db.update(user).set({ createdAt: new Date(now.getTime() - 10 * 86_400_000) }).where(eq(user.id, "c"));
    await db.update(user).set({ createdAt: new Date(now.getTime() - 40 * 86_400_000) }).where(eq(user.id, "old"));
    await store.record("a", { r: "site_bole", t: 1 });
    await store.record("a", { s: "tiktok", t: 2 }); // first touch wins
    await store.record("b", { s: "telegram", t: 1 });
    await store.record("c", { r: "u_abc12345", t: 1 });
    await store.record("old", { s: "telegram", t: 1 });
    // d has no record: direct.
    const b = await store.breakdown(now);
    expect(b.d7).toMatchObject({ badge: 1, telegram: 1, direct: 1, referral: 0, tiktok: 0 });
    expect(b.d30).toMatchObject({ badge: 1, telegram: 1, direct: 1, referral: 1 });
  });

  it("memory store matches", async () => {
    let t = new Date("2026-11-01T00:00:00Z");
    const mem = new MemorySignupSourceStore(() => t);
    await mem.record("x", { h: "lnkd.in", t: 0 });
    t = new Date("2026-11-17T00:00:00Z");
    await mem.record("y", null);
    const b = await mem.breakdown(new Date("2026-11-18T00:00:00Z"));
    expect(b.d7).toMatchObject({ direct: 1, linkedin: 0 });
    expect(b.d30).toMatchObject({ direct: 1, linkedin: 1 });
  });
});

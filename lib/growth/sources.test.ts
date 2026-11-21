import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { payments, user } from "@/lib/db/schema";
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

  it("counts sign-ups and paid customers from our own posts, per post and network", async () => {
    for (const id of ["p1", "p2", "p3", "x"]) await makeUser(db, id);
    await store.record("p1", { s: "telegram", m: "social", c: "post-2026-11-20", t: 1 });
    await store.record("p2", { s: "telegram", m: "social", c: "post-2026-11-20", t: 1 });
    await store.record("p3", { s: "facebook", m: "social", c: "post-2026-11-21", t: 1 });
    await store.record("x", { s: "telegram", c: "launch", t: 1 });
    const pay = { product: "starter_month", amountMinor: 50000, currency: "ETB", method: "telebirr" } as const;
    await db.insert(payments).values([
      { ...pay, userId: "p1", reference: "R1", status: "approved" },
      { ...pay, userId: "p1", reference: "R2", status: "approved" },
      { ...pay, userId: "p2", reference: "R3", status: "pending" },
    ]);
    const rows = await store.fromPosts(new Date(Date.now() - 86_400_000));
    const by = Object.fromEntries(rows.map((r) => [`${r.campaign}|${r.source}`, r]));
    expect(Object.keys(by).sort()).toEqual(["post-2026-11-20|telegram", "post-2026-11-21|facebook"]);
    expect(by["post-2026-11-20|telegram"]).toMatchObject({ signups: 2, paid: 1 });
    expect(by["post-2026-11-21|facebook"]).toMatchObject({ signups: 1, paid: 0 });
    expect(await store.fromPosts(new Date(Date.now() + 86_400_000))).toEqual([]);
  });
});

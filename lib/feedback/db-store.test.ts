import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { auditLog, feedback, subscriptions } from "@/lib/db/schema";
import { makeUser, testDb } from "@/test/db";
import { DbFeedbackStore } from "./store";
import type { FeedbackInput } from "./types";

const input = (message: string, type: FeedbackInput["type"] = "idea"): FeedbackInput => ({ type, message, rating: 4, page: "/en/build", locale: "en", device: "phone", userAgent: "UA" });
const shot = { full: Buffer.from("full-png"), thumb: Buffer.from("thumb") };

describe("DbFeedbackStore", () => {
  it("keeps each owner to their own feedback, and gives admins the owner and plan", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
    await db.insert(subscriptions).values({ userId: "bob", plan: "starter", period: "month", currentPeriodEnd: new Date(Date.now() + 86_400_000) });
    const store = new DbFeedbackStore(db);
    const a = await store.add("alice", input("Alice has an idea"), shot);
    const b = await store.add("bob", input("Bob found a problem", "problem"), null);
    expect(a).toMatchObject({ ownerId: "alice", status: "new", hasScreenshot: true, rating: 4, reply: null });
    expect(b.hasScreenshot).toBe(false);

    expect((await store.listForOwner("alice", 50)).map((f) => f.id)).toEqual([a.id]);
    expect((await store.listForOwner("bob", 50)).map((f) => f.id)).toEqual([b.id]);
    expect(await store.screenshot(a.id, "bob", "full")).toBeNull();
    expect(Buffer.from((await store.screenshot(a.id, "alice", "full")) ?? [])).toEqual(shot.full);
    expect(Buffer.from((await store.screenshot(a.id, null, "thumb")) ?? [])).toEqual(shot.thumb);
    expect(await store.screenshotBytes("alice", null)).toBe(shot.full.length);
    expect(await store.screenshotBytes("alice", new Date(Date.now() + 60_000))).toBe(0);
    expect(await store.screenshotBytes("bob", null)).toBe(0);

    const all = await store.adminList({}, 50);
    expect(all.map((f) => f.owner)).toEqual([
      { name: "bob", contact: "bob@example.com", plan: "starter" },
      { name: "alice", contact: "alice@example.com", plan: "free" },
    ]);
    expect((await store.adminList({ type: "problem" }, 50)).map((f) => f.id)).toEqual([b.id]);
    expect(await store.countByStatus()).toEqual({ new: 2, seen: 0, planned: 0, done: 0, wont_do: 0 });

    // Retention clears both pictures and keeps the message and the byte count of what is left.
    await db.update(feedback).set({ createdAt: new Date(Date.now() - 91 * 86_400_000) }).where(eq(feedback.id, a.id));
    expect(await store.purgeScreenshots(new Date(Date.now() - 90 * 86_400_000))).toBe(1);
    expect(await store.screenshot(a.id, null, "thumb")).toBeNull();
    expect((await store.get(a.id))?.hasScreenshot).toBe(false);
    expect(await store.screenshotBytes("alice", null)).toBe(0);
  }, 30_000);

  it("changes status and reply in one statement with its audit entries; the reply is unread until the owner looks", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
    const store = new DbFeedbackStore(db);
    const a = await store.add("alice", input("Please add Telebirr"), null);

    expect(await store.update(a.id, "admin", { status: "new", reply: "Coming next month" })).toEqual({ outcome: "ok", from: "new", to: "seen", replyChanged: true });
    const audit = async () => (await db.select({ action: auditLog.action, data: auditLog.data, actor: auditLog.actorId }).from(auditLog).where(eq(auditLog.targetId, a.id))).sort((x, y) => x.action.localeCompare(y.action));
    expect(await audit()).toEqual([
      { action: "feedback.reply", data: { length: 17, text: "Coming next month" }, actor: "admin" },
      { action: "feedback.status", data: { from: "new", to: "seen" }, actor: "admin" },
    ]);
    expect(await store.get(a.id)).toMatchObject({ status: "seen", reply: "Coming next month", replyReadAt: null });
    expect(await store.unreadReplies("alice")).toBe(1);
    await store.markRepliesRead("bob");
    expect(await store.unreadReplies("alice")).toBe(1);
    await store.markRepliesRead("alice");
    expect(await store.unreadReplies("alice")).toBe(0);

    // Same reply and status: nothing changes, nothing is audited, the reply stays read.
    expect((await store.update(a.id, "admin", { status: "seen", reply: "Coming next month" })).outcome).toBe("unchanged");
    expect((await store.update(a.id, "admin", { status: "planned", reply: "" })).outcome).toBe("ok");
    expect(await audit()).toHaveLength(3);
    expect(await store.unreadReplies("alice")).toBe(0);

    // A long reply is stored whole and audited in part.
    const long = "y".repeat(900);
    await store.update(a.id, "admin", { status: "planned", reply: long });
    const entry = (await audit()).filter((e) => e.action === "feedback.reply").find((e) => (e.data as { length: number }).length === 900);
    expect((entry?.data as { text: string }).text).toHaveLength(500);
    expect((await store.get(a.id))?.reply).toBe(long);

    expect(await store.update("0b8f3a8e-1111-4222-8333-944445555666", "admin", { status: "done", reply: "x" })).toEqual({ outcome: "not_found" });
  }, 30_000);
});

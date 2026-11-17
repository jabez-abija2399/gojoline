import { describe, expect, it } from "vitest";
import { subscriptions } from "@/lib/db/schema";
import { makeUser, testDb } from "@/test/db";
import { updateFeedback } from "./admin";
import { DbFeedbackStore } from "./store";
import type { FeedbackInput } from "./types";

const input = (message: string, type: FeedbackInput["type"] = "idea"): FeedbackInput => ({ type, message, rating: 4, page: "/en/build", locale: "en", device: "phone", userAgent: "UA" });

describe("DbFeedbackStore", () => {
  it("keeps each owner to their own feedback, and gives admins the owner and plan", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
    await db.insert(subscriptions).values({ userId: "bob", plan: "starter", period: "month", currentPeriodEnd: new Date(Date.now() + 86_400_000) });
    const store = new DbFeedbackStore(db);
    const a = await store.add("alice", input("Alice has an idea"), Buffer.from("png"));
    const b = await store.add("bob", input("Bob found a problem", "problem"), null);
    expect(a).toMatchObject({ ownerId: "alice", status: "new", hasScreenshot: true, rating: 4, reply: null });
    expect(b.hasScreenshot).toBe(false);

    expect((await store.listForOwner("alice", 50)).map((f) => f.id)).toEqual([a.id]);
    expect((await store.listForOwner("bob", 50)).map((f) => f.id)).toEqual([b.id]);
    expect(await store.screenshot(a.id, "bob")).toBeNull();
    expect(Buffer.from(await store.screenshot(a.id, "alice") ?? [])).toEqual(Buffer.from("png"));
    expect(Buffer.from(await store.screenshot(a.id, null) ?? [])).toEqual(Buffer.from("png"));

    const all = await store.adminList({}, 50);
    expect(all.map((f) => f.owner)).toEqual([
      { name: "bob", contact: "bob@example.com", plan: "starter" },
      { name: "alice", contact: "alice@example.com", plan: "free" },
    ]);
    expect((await store.adminList({ type: "problem" }, 50)).map((f) => f.id)).toEqual([b.id]);
    expect(await store.countByStatus()).toEqual({ new: 2, seen: 0, planned: 0, done: 0, wont_do: 0 });
  }, 30_000);

  it("changes status and replies with audit entries; the reply is unread until the owner looks", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
    const store = new DbFeedbackStore(db);
    const a = await store.add("alice", input("Please add Telebirr"), null);
    const log: string[] = [];
    const deps = { store, audit: async (e: { action: string; data?: Record<string, unknown> }) => void log.push(`${e.action} ${JSON.stringify(e.data)}`) };

    expect(await updateFeedback(deps, "admin", a.id, { status: "planned", reply: "Coming next month" })).toBe("ok");
    expect(log).toEqual(['feedback.reply {"length":17}', 'feedback.status {"from":"new","to":"planned"}']);
    expect(await store.get(a.id)).toMatchObject({ status: "planned", reply: "Coming next month", replyReadAt: null });
    expect(await store.unreadReplies("alice")).toBe(1);
    // Another owner can't mark it read.
    await store.markRepliesRead("bob");
    expect(await store.unreadReplies("alice")).toBe(1);
    await store.markRepliesRead("alice");
    expect(await store.unreadReplies("alice")).toBe(0);

    expect(await store.setStatus("0b8f3a8e-1111-4222-8333-944445555666", "done")).toBeNull();
    expect(await store.reply("0b8f3a8e-1111-4222-8333-944445555666", "x", "admin")).toBe(false);
  }, 30_000);
});

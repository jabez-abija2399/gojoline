import { describe, expect, it } from "vitest";
import { MemoryRateLimiter } from "@/lib/rate-limit";
import { MemoryFeedbackStore } from "./store";
import { submitFeedback } from "./submit";
import type { FeedbackInput } from "./types";

const fields = { type: "problem", message: "The preview stays white", locale: "am", device: "phone", page: "/am/build/x" };
const shot = (bytes = 1000) => ({ full: Buffer.alloc(bytes, 1), thumb: Buffer.from("t") });
const input = (message: string, type: FeedbackInput["type"] = "idea"): FeedbackInput => ({ type, message, rating: null, page: null, locale: "en", device: "phone", userAgent: null });

function setup() {
  const log: { action: string; targetId: string; data?: Record<string, unknown> }[] = [];
  const store = new MemoryFeedbackStore(async (id) => ({ name: id, contact: `${id}@example.com`, plan: "free" }), async (e) => void log.push(e));
  return { store, limiter: new MemoryRateLimiter(), log };
}
type Opts = { network?: string; verified?: boolean; withShot?: ReturnType<typeof shot> | "invalid" | null };
const send = (s: ReturnType<typeof setup>, ownerId: string, o: Opts = {}) =>
  submitFeedback(
    { store: s.store, limiter: s.limiter },
    { ownerId, verified: o.verified ?? true, network: o.network ?? "1.1.1.1", fields, userAgent: "UA", hasScreenshot: !!o.withShot, screenshot: async () => o.withShot ?? "invalid" },
  );

describe("submitFeedback", () => {
  it("saves a valid message as New for its owner", async () => {
    const s = setup();
    const r = await send(s, "alice");
    expect(r.ok && r.feedback).toMatchObject({ ownerId: "alice", status: "new", type: "problem", page: "/am/build/x", userAgent: "UA", hasScreenshot: false });
  });

  it("allows 10 an hour per owner, and limits the network too", async () => {
    const s = setup();
    for (let i = 0; i < 10; i++) expect((await send(s, "alice")).ok).toBe(true);
    expect(await send(s, "alice")).toEqual({ ok: false, error: "too_many" });
    for (let i = 0; i < 19; i++) expect((await send(s, `o${i}`)).ok).toBe(true);
    expect(await send(s, "bob")).toEqual({ ok: false, error: "too_many" });
    expect((await send(s, "bob", { network: "2.2.2.2" })).ok).toBe(true);
  });

  it("allows 20 a day per owner", async () => {
    let now = 0;
    const s = setup();
    s.limiter = new MemoryRateLimiter(() => now);
    for (let i = 0; i < 20; i++) {
      if (i % 10 === 0) now += 3_600_001;
      expect((await send(s, "alice", { network: `n${i}` })).ok).toBe(true);
    }
    now += 3_600_001;
    expect(await send(s, "alice", { network: "fresh" })).toEqual({ ok: false, error: "too_many" });
  });

  it("takes screenshots only from verified owners, and refuses a bad one without saving", async () => {
    const s = setup();
    expect(await send(s, "a", { verified: false, withShot: shot() })).toEqual({ ok: false, error: "screenshot_unverified" });
    expect((await send(s, "a", { verified: false })).ok).toBe(true);
    expect(await send(s, "a", { withShot: "invalid" })).toEqual({ ok: false, error: "screenshot" });
    expect(s.store.rows).toHaveLength(1);
    const ok = await send(s, "a", { withShot: shot() });
    expect(ok.ok && ok.feedback.hasScreenshot).toBe(true);
  });

  it("caps stored screenshot bytes per owner per day and in total", async () => {
    const s = setup();
    const mb = 1024 * 1024;
    expect((await send(s, "a", { network: "x1", withShot: shot(9 * mb) })).ok).toBe(true);
    expect(await send(s, "a", { network: "x2", withShot: shot(2 * mb) })).toEqual({ ok: false, error: "screenshot_quota" });
    // Older pictures count toward the total only.
    for (const r of s.store.rows) r.createdAt = new Date(Date.now() - 2 * 86_400_000);
    expect((await send(s, "a", { network: "x3", withShot: shot(9 * mb) })).ok).toBe(true);
    for (const r of s.store.rows) r.createdAt = new Date(Date.now() - 2 * 86_400_000);
    expect(await send(s, "a", { network: "x4", withShot: shot(3 * mb) })).toEqual({ ok: false, error: "screenshot_quota" });
    // Another owner has their own allowance; text without a picture always goes through.
    expect((await send(s, "b", { network: "x5", withShot: shot(3 * mb) })).ok).toBe(true);
    expect((await send(s, "a", { network: "x6" })).ok).toBe(true);
  });
});

describe("owner scoping and retention", () => {
  it("lists, counts and opens only the owner's own items", async () => {
    const { store } = setup();
    const a = await store.add("alice", input("Alice idea"), shot(3));
    await store.add("bob", input("Bob idea"), null);
    expect((await store.listForOwner("alice", 50)).map((f) => f.message)).toEqual(["Alice idea"]);
    expect(await store.screenshot(a.id, "bob", "full")).toBeNull();
    expect(await store.screenshot(a.id, "alice", "full")).toEqual(Buffer.alloc(3, 1));
    expect(await store.screenshot(a.id, null, "thumb")).toEqual(Buffer.from("t"));
    await store.update(a.id, "admin", { status: "new", reply: "Thanks" });
    await store.markRepliesRead("bob");
    expect(await store.unreadReplies("alice")).toBe(1);
  });

  it("clears screenshots older than the cut-off and keeps the message", async () => {
    const { store } = setup();
    const old = await store.add("a", input("Old one"), shot());
    const fresh = await store.add("a", input("New one"), shot());
    store.rows[0]!.createdAt = new Date(Date.now() - 91 * 86_400_000);
    expect(await store.purgeScreenshots(new Date(Date.now() - 90 * 86_400_000))).toBe(1);
    expect(await store.screenshot(old.id, null, "thumb")).toBeNull();
    expect((await store.get(old.id))?.message).toBe("Old one");
    expect(await store.screenshot(fresh.id, null, "full")).not.toBeNull();
  });
});

describe("update", () => {
  it("changes the status with an audit entry naming from and to", async () => {
    const { store, log } = setup();
    const f = await store.add("alice", input("Hello there"), null);
    expect(await store.update(f.id, "admin", { status: "planned", reply: "" })).toEqual({ outcome: "ok", from: "new", to: "planned", replyChanged: false });
    expect(log).toEqual([{ actorId: "admin", action: "feedback.status", targetType: "feedback", targetId: f.id, data: { from: "new", to: "planned" } }]);
    expect((await store.update(f.id, "admin", { status: "planned", reply: "" })).outcome).toBe("unchanged");
    expect(log).toHaveLength(1);
  });

  it("saves a reply unread for the owner, moves New to Seen and audits the text (capped)", async () => {
    const { store, log } = setup();
    const f = await store.add("alice", input("Can I use my domain?", "question"), null);
    const long = `Yes. ${"x".repeat(700)}`;
    expect((await store.update(f.id, "admin", { status: "new", reply: ` ${long} ` })).outcome).toBe("ok");
    expect(await store.get(f.id)).toMatchObject({ reply: long, status: "seen", replyReadAt: null });
    expect(log.map((l) => l.action)).toEqual(["feedback.reply", "feedback.status"]);
    expect(log[0]!.data).toEqual({ length: long.length, text: long.slice(0, 500) });
    await store.markRepliesRead("alice");
    expect(await store.unreadReplies("alice")).toBe(0);
    // The same reply again changes nothing and stays read; an empty box keeps it.
    expect((await store.update(f.id, "admin", { status: "seen", reply: long })).outcome).toBe("unchanged");
    expect((await store.update(f.id, "admin", { status: "seen", reply: "" })).outcome).toBe("unchanged");
    expect(await store.unreadReplies("alice")).toBe(0);
  });

  it("answers not_found for a missing item, and counts and filters for the admin", async () => {
    const { store } = setup();
    expect(await store.update("0b8f3a8e-1111-4222-8333-944445555666", "admin", { status: "done", reply: "" })).toEqual({ outcome: "not_found" });
    const a = await store.add("a", input("One idea"), null);
    await store.add("b", input("Love it!", "praise"), null);
    await store.update(a.id, "admin", { status: "done", reply: "" });
    expect(await store.countByStatus()).toEqual({ new: 1, seen: 0, planned: 0, done: 1, wont_do: 0 });
    expect((await store.adminList({ status: "new" }, 50)).map((f) => f.type)).toEqual(["praise"]);
    expect((await store.adminList({ type: "idea" }, 50)).map((f) => f.owner?.contact)).toEqual(["a@example.com"]);
  });
});

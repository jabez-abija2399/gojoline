import { describe, expect, it } from "vitest";
import { MemoryRateLimiter } from "@/lib/rate-limit";
import { updateFeedback } from "./admin";
import { MemoryFeedbackStore } from "./store";
import { submitFeedback } from "./submit";

const fields = { type: "problem", message: "The preview stays white", locale: "am", device: "phone", page: "/am/build/x" };
const send = (store: MemoryFeedbackStore, limiter: MemoryRateLimiter, ownerId: string, network = "1.1.1.1") =>
  submitFeedback({ store, limiter }, { ownerId, network, fields, userAgent: "UA", screenshot: async () => null });

function setup() {
  const store = new MemoryFeedbackStore(async (id) => ({ name: id, contact: `${id}@example.com`, plan: "free" }));
  const log: { action: string; targetId: string; data?: Record<string, unknown> }[] = [];
  return { store, limiter: new MemoryRateLimiter(), log, deps: { store, audit: async (e: (typeof log)[number]) => void log.push(e) } };
}

describe("submitFeedback", () => {
  it("saves a valid message as New for its owner", async () => {
    const { store, limiter } = setup();
    const r = await send(store, limiter, "alice");
    expect(r.ok && r.feedback).toMatchObject({ ownerId: "alice", status: "new", type: "problem", page: "/am/build/x", userAgent: "UA", hasScreenshot: false });
  });

  it("allows 10 an hour per owner, and limits the network too", async () => {
    const { store, limiter } = setup();
    for (let i = 0; i < 10; i++) expect((await send(store, limiter, "alice")).ok).toBe(true);
    expect(await send(store, limiter, "alice")).toEqual({ ok: false, error: "too_many" });
    // Others on the same network still get through until the network's own limit.
    for (let i = 0; i < 19; i++) expect((await send(store, limiter, `o${i}`)).ok).toBe(true);
    expect(await send(store, limiter, "bob")).toEqual({ ok: false, error: "too_many" });
    expect((await send(store, limiter, "bob", "2.2.2.2")).ok).toBe(true);
  });

  it("refuses a bad screenshot without saving", async () => {
    const { store, limiter } = setup();
    const r = await submitFeedback({ store, limiter }, { ownerId: "a", network: "n", fields, userAgent: null, screenshot: async () => "invalid" });
    expect(r).toEqual({ ok: false, error: "screenshot" });
    expect(store.rows).toHaveLength(0);
  });
});

describe("owner scoping", () => {
  it("lists, counts and opens only the owner's own items", async () => {
    const { store } = setup();
    const a = await store.add("alice", { type: "idea", message: "Alice idea", rating: 5, page: null, locale: "en", device: "computer", userAgent: null }, Buffer.from("img"));
    await store.add("bob", { type: "idea", message: "Bob idea", rating: null, page: null, locale: "en", device: "computer", userAgent: null }, null);
    expect((await store.listForOwner("alice", 50)).map((f) => f.message)).toEqual(["Alice idea"]);
    expect(await store.screenshot(a.id, "bob")).toBeNull();
    expect(await store.screenshot(a.id, "alice")).toEqual(Buffer.from("img"));
    expect(await store.screenshot(a.id, null)).toEqual(Buffer.from("img"));
    await store.reply(a.id, "Thanks", "admin");
    expect(await store.unreadReplies("bob")).toBe(0);
    await store.markRepliesRead("bob");
    expect(await store.unreadReplies("alice")).toBe(1);
  });
});

describe("updateFeedback", () => {
  it("changes the status with an audit entry naming from and to", async () => {
    const { store, deps, log } = setup();
    const f = await store.add("alice", { type: "idea", message: "Hello there", rating: null, page: null, locale: "en", device: "phone", userAgent: null }, null);
    expect(await updateFeedback(deps, "admin", f.id, { status: "planned", reply: "" })).toBe("ok");
    expect((await store.get(f.id))?.status).toBe("planned");
    expect(log).toEqual([{ actorId: "admin", action: "feedback.status", targetType: "feedback", targetId: f.id, data: { from: "new", to: "planned" } }]);
    expect(await updateFeedback(deps, "admin", f.id, { status: "planned", reply: "" })).toBe("unchanged");
    expect(log).toHaveLength(1);
  });

  it("saves a reply as unread for the owner, moves New to Seen and audits both", async () => {
    const { store, deps, log } = setup();
    const f = await store.add("alice", { type: "question", message: "Can I use my domain?", rating: null, page: null, locale: "en", device: "phone", userAgent: null }, null);
    expect(await updateFeedback(deps, "admin", f.id, { status: "new", reply: " Yes, on Business. " })).toBe("ok");
    const after = await store.get(f.id);
    expect(after).toMatchObject({ reply: "Yes, on Business.", status: "seen", replyReadAt: null });
    expect(log.map((l) => l.action)).toEqual(["feedback.reply", "feedback.status"]);
    expect(await store.unreadReplies("alice")).toBe(1);
    await store.markRepliesRead("alice");
    expect(await store.unreadReplies("alice")).toBe(0);
    // Saving the same reply again changes nothing and stays read.
    expect(await updateFeedback(deps, "admin", f.id, { status: "seen", reply: "Yes, on Business." })).toBe("unchanged");
    expect(await store.unreadReplies("alice")).toBe(0);
  });

  it("answers not_found for a missing item", async () => {
    const { deps } = setup();
    expect(await updateFeedback(deps, "admin", "0b8f3a8e-1111-4222-8333-944445555666", { status: "done", reply: "" })).toBe("not_found");
  });

  it("counts by status for the admin badge and filters by status and type", async () => {
    const { store, deps } = setup();
    const a = await store.add("a", { type: "idea", message: "One idea", rating: null, page: null, locale: "en", device: "phone", userAgent: null }, null);
    await store.add("b", { type: "praise", message: "Love it!", rating: 5, page: null, locale: "am", device: "phone", userAgent: null }, null);
    await updateFeedback(deps, "admin", a.id, { status: "done", reply: "" });
    expect(await store.countByStatus()).toEqual({ new: 1, seen: 0, planned: 0, done: 1, wont_do: 0 });
    expect((await store.adminList({ status: "new" }, 50)).map((f) => f.type)).toEqual(["praise"]);
    expect((await store.adminList({ type: "idea" }, 50)).map((f) => f.owner?.contact)).toEqual(["a@example.com"]);
  });
});

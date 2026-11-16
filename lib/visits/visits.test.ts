import { describe, expect, it } from "vitest";
import { DbProjectStore } from "@/lib/projects/db-store";
import { MemoryRateLimiter } from "@/lib/rate-limit";
import { makeUser, testDb } from "@/test/db";
import type { PublicSite } from "@/lib/cloud/types";
import { deviceOf, isBot, sourceOf } from "./classify";
import { MemoryVisitCounter } from "./counter";
import { DbVisitsDailyStore, MemoryVisitsDailyStore } from "./daily";
import { recordVisit, type VisitDeps as RecordDeps } from "./record";
import { rollupDay, visitStats } from "./stats";

const PROJECT = "11111111-1111-4111-8111-111111111111";
const ORIGIN = "https://selam.afridea.et";
const PHONE = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";
const site = (over: Partial<PublicSite> = {}): PublicSite => ({ siteId: "s1", projectId: PROJECT, ownerId: "alice", siteKey: "key-123", status: "published", url: ORIGIN, customDomain: "selamcafe.com", offline: false, ...over });

function setup(now = { t: Date.parse("2026-11-16T09:00:00Z") }, over: Partial<PublicSite> = {}) {
  const counter = new MemoryVisitCounter(() => now.t);
  const deps: RecordDeps = { publicSite: async (id) => (id === PROJECT ? site(over) : null), counter, limiter: new MemoryRateLimiter(() => now.t), now: () => now.t };
  const visit = async (o: { ip?: string; ua?: string; ref?: string; src?: string; origin?: string | null; key?: string | null; raw?: string; fetchSite?: string | null } = {}) => {
    const r = await recordVisit(deps, {
      fetchSite: o.fetchSite === undefined ? "cross-site" : o.fetchSite,
      projectId: PROJECT,
      origin: o.origin === undefined ? ORIGIN : o.origin,
      siteKey: o.key === undefined ? "key-123" : o.key,
      ip: o.ip ?? "1.2.3.4",
      userAgent: o.ua ?? PHONE,
      raw: o.raw ?? JSON.stringify({ path: "/", ref: o.ref ?? "", ...(o.src ? { src: o.src } : {}) }),
    });
    await r.count?.();
    return r.status;
  };
  return { counter, deps, visit, now };
}

describe("sourceOf, deviceOf, isBot", () => {
  it.each([
    ["https://t.me/", undefined, "telegram"],
    ["https://web.telegram.org/k/", undefined, "telegram"],
    ["https://l.facebook.com/l.php?u=x", undefined, "facebook"],
    ["https://m.facebook.com/", undefined, "facebook"],
    ["https://www.google.com/", undefined, "google"],
    ["https://www.google.com.et/", undefined, "google"],
    ["https://www.tiktok.com/@x", undefined, "tiktok"],
    ["https://example.org/page", undefined, "other"],
    ["", undefined, "direct"],
    ["not a url", undefined, "direct"],
    ["https://selam.afridea.et/menu", undefined, "direct"],
    ["https://www.google.com/", "qr", "qr"],
    ["", "qr", "qr"],
  ])("%s (src %s) is %s", (ref, src, bucket) => {
    expect(sourceOf(ref, src, ["selam.afridea.et", "selamcafe.com"])).toBe(bucket);
  });
  it("tells phones from computers and skips bots", () => {
    expect(deviceOf(PHONE)).toBe("phone");
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("phone");
    expect(deviceOf(DESKTOP)).toBe("computer");
    expect(isBot("TelegramBot (like TwitterBot)")).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot(PHONE)).toBe(false);
  });
});

describe("recordVisit", () => {
  it("counts a person once a day however many pages they open, and the source on their first visit", async () => {
    const { visit, counter } = setup();
    expect(await visit({ ref: "https://t.me/" })).toBe(204);
    expect(await visit({ ref: "https://selam.afridea.et/" })).toBe(204);
    expect(await visit({ ip: "5.6.7.8", ua: DESKTOP, src: "qr" })).toBe(204);
    expect(await counter.day(PROJECT, "2026-11-16")).toEqual({ views: 3, visitors: 2, referrers: { telegram: 1, qr: 1 }, devices: { phone: 1, computer: 1 } });
  });

  it("the same person is a new visitor on a new day (the salt changes), and never stores the IP", async () => {
    const now = { t: Date.parse("2026-11-16T09:00:00Z") };
    const { visit, counter } = setup(now);
    const s1 = await counter.salt("2026-11-16");
    await visit();
    now.t += 86_400_000;
    const s2 = await counter.salt("2026-11-17");
    expect(s2).not.toBe(s1);
    expect(s1).toMatch(/^[0-9a-f]{64}$/);
    await visit();
    expect((await counter.day(PROJECT, "2026-11-17"))?.visitors).toBe(1);
    expect(JSON.stringify(counter)).not.toContain("1.2.3.4");
  });

  it("makes a new salt after 25 hours and drops counts after 3 days", async () => {
    const now = { t: Date.parse("2026-11-16T09:00:00Z") };
    const { visit, counter } = setup(now);
    const first = await counter.salt("2026-11-16");
    now.t += 24 * 3_600_000;
    expect(await counter.salt("2026-11-16")).toBe(first);
    now.t += 2 * 3_600_000;
    expect(await counter.salt("2026-11-16")).not.toBe(first);
    now.t = Date.parse("2026-11-16T09:00:00Z");
    await visit();
    now.t += 3 * 86_400_000 + 1;
    expect(await counter.day(PROJECT, "2026-11-16")).toBeNull();
  });

  it("refuses other origins, wrong keys, oversized or malformed bodies, and unknown sites", async () => {
    const { visit } = setup();
    expect(await visit({ origin: "https://evil.example" })).toBe(403);
    expect(await visit({ origin: null })).toBe(403);
    expect(await visit({ key: "nope" })).toBe(403);
    expect(await visit({ key: null })).toBe(403);
    expect(await visit({ raw: JSON.stringify({ path: "/", ref: "", pad: "x".repeat(400) }) })).toBe(413);
    expect(await visit({ raw: "{nope" })).toBe(400);
    expect(await visit({ raw: JSON.stringify({ path: "no-slash", ref: "" }) })).toBe(400);
    expect(await visit({ origin: "https://selamcafe.com" })).toBe(204);
  });

  it("lets one address add at most 5 people a day, and ignores requests that aren't from another site", async () => {
    const { visit, counter } = setup();
    for (let i = 0; i < 8; i++) await visit({ ua: `${PHONE} v${i}` });
    expect(await counter.day(PROJECT, "2026-11-16")).toMatchObject({ views: 8, visitors: 5 });
    await visit({ ua: `${PHONE} v1` });
    expect((await counter.day(PROJECT, "2026-11-16"))?.visitors).toBe(5);
    expect(await visit({ fetchSite: "same-origin", ip: "7.7.7.7" })).toBe(204);
    expect(await visit({ fetchSite: "none", ip: "7.7.7.7" })).toBe(204);
    expect((await counter.day(PROJECT, "2026-11-16"))?.views).toBe(9);
    expect(await visit({ fetchSite: null, ip: "7.7.7.7" })).toBe(204);
    expect((await counter.day(PROJECT, "2026-11-16"))?.views).toBe(10);
  });

  it("takes the key from the body (sendBeacon can't send headers)", async () => {
    const { visit, counter } = setup();
    expect(await visit({ key: null, raw: JSON.stringify({ path: "/", ref: "", key: "key-123" }) })).toBe(204);
    expect((await counter.day(PROJECT, "2026-11-16"))?.views).toBe(1);
  });

  it("ignores bots and resting sites, and rate limits one address", async () => {
    const { visit, counter } = setup();
    expect(await visit({ ua: "Googlebot/2.1" })).toBe(204);
    expect(await counter.day(PROJECT, "2026-11-16")).toBeNull();
    for (let i = 0; i < 60; i++) await visit();
    expect(await visit()).toBe(429);
    expect(await visit({ ip: "9.9.9.9" })).toBe(204);
    const resting = setup(undefined, { offline: true });
    expect(await resting.visit()).toBe(204);
    expect(await resting.counter.day(PROJECT, "2026-11-16")).toBeNull();
  });
});

describe("rollup and stats", () => {
  it("copies live days into Postgres, tops up on read, and reads only the owner's numbers", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
    const p = await new DbProjectStore(db).createProject("alice", { name: "Selam", locale: "en" });
    const now = Date.parse("2026-11-16T09:00:00Z");
    const counter = new MemoryVisitCounter(() => now);
    const daily = new DbVisitsDailyStore(db);
    await counter.record(p.id, "2026-11-15", "v1", { source: "telegram", device: "phone", ip: "a", maxPerIp: 5 });
    await counter.record(p.id, "2026-11-15", "v2", { source: "qr", device: "phone", ip: "b", maxPerIp: 5 });
    await counter.record(p.id, "2026-11-16", "v1", { source: "google", device: "computer", ip: "a", maxPerIp: 5 });
    // An older day only in Postgres (its live counts are long gone).
    await daily.upsert(p.id, "2026-11-06", { views: 5, visitors: 4, referrers: { direct: 4 }, devices: { phone: 4 } });

    expect(await rollupDay({ counter, daily }, "2026-11-15")).toBe(1);
    expect(await rollupDay({ counter, daily }, "2026-11-15")).toBe(1);
    const owns = async (o: string, id: string) => o === "alice" && id === p.id;
    // Someone else asking for this project gets nothing, and nothing is written.
    expect(await visitStats({ counter, daily, owns }, "bob", p.id, now)).toMatchObject({ thisWeek: 0, any: false });
    expect(await daily.range("alice", p.id, "2026-11-16", "2026-11-16")).toEqual([]);
    const stats = await visitStats({ counter, daily, owns }, "alice", p.id, now);
    expect(stats.perDay).toHaveLength(14);
    expect(stats.perDay.at(-1)).toEqual({ day: "2026-11-16", value: 1 });
    expect(stats.perDay.at(-2)).toEqual({ day: "2026-11-15", value: 2 });
    expect(stats).toMatchObject({ thisWeek: 3, lastWeek: 4, any: true, sources: { telegram: 1, qr: 1, google: 1 }, devices: { phone: 2, computer: 1 } });

    // A smaller, later write never lowers a day.
    await daily.upsert(p.id, "2026-11-15", { views: 1, visitors: 1, referrers: {}, devices: {} });
    expect((await daily.range("alice", p.id, "2026-11-15", "2026-11-15"))[0]).toMatchObject({ views: 2, visitors: 2, referrers: { telegram: 1, qr: 1 } });
    expect(await daily.range("bob", p.id, "2026-11-01", "2026-11-16")).toEqual([]);
  }, 30_000);

  it("the memory store behaves the same for owners", async () => {
    const daily = new MemoryVisitsDailyStore(async (id) => (id === PROJECT ? "alice" : null));
    await daily.upsert(PROJECT, "2026-11-10", { views: 3, visitors: 2, referrers: { qr: 2 }, devices: { phone: 2 } });
    expect(await daily.range("alice", PROJECT, "2026-11-01", "2026-11-16")).toEqual([{ day: "2026-11-10", views: 3, visitors: 2, referrers: { qr: 2 }, devices: { phone: 2 } }]);
    expect(await daily.range("bob", PROJECT, "2026-11-01", "2026-11-16")).toEqual([]);
    const stats = await visitStats({ counter: new MemoryVisitCounter(), daily, owns: async () => true }, "alice", PROJECT, Date.parse("2026-11-16T09:00:00Z"));
    expect(stats).toMatchObject({ thisWeek: 2, lastWeek: 0, any: true });
  });
});

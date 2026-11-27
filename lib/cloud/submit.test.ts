import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { DbProjectStore } from "@/lib/projects/db-store";
import { MemoryRateLimiter } from "@/lib/rate-limit";
import { DbSiteStore } from "@/lib/sites/db-store";
import { makeUser, testDb } from "@/test/db";
import { DbCloudStore } from "./db-store";
import { extractForms } from "./forms";
import { handleSubmission, type SubmitDeps } from "./submit";
import type { Submission } from "./types";

const ORIGIN = "https://gojo-selam.vercel.app";
let deps: SubmitDeps;
let cloud: DbCloudStore;
let sites: DbSiteStore;
let projectId: string;
let siteKey: string;
const notified: Submission[] = [];
/** The owner's plan includes Telegram alerts (Starter, Business). */
let alerts = true;

beforeEach(async () => {
  const db = await testDb();
  await makeUser(db, "alice");
  const store = new DbProjectStore(db);
  sites = new DbSiteStore(db);
  cloud = new DbCloudStore(db);
  const p = await store.createProject("alice", { name: "Selam", locale: "en" });
  projectId = p.id;
  await sites.reserve("alice", p.id, "selam", "vercel");
  const site = await sites.savePublished("alice", { projectId: p.id, slug: "selam", provider: "vercel", providerProjectId: "prj", url: ORIGIN, publishedVersion: 1, lastDeploymentId: "d", publishedAt: new Date() });
  siteKey = site.siteKey!;
  await cloud.saveForms(site.id, extractForms(readFileSync("templates/site/src/site.json", "utf8")));
  notified.length = 0;
  alerts = true;
  deps = { cloud, limiter: new MemoryRateLimiter(), notifier: { notify: async (s) => void notified.push(s) }, entitlements: async () => ({ answersPerMonth: 2_000, telegramNotify: alerts }) };
}, 30_000);

const good = () => ({ answers: { name: "Abebe", phone: "0911234567", date: "2026-12-01", guests: "2" }, lang: "am", _hp: "", _ms: 5000 });
const call = (over: Partial<Parameters<typeof handleSubmission>[1]> = {}) =>
  handleSubmission(deps, { projectId, formKey: "booking", origin: ORIGIN, siteKey, ip: "1.1.1.1", body: good(), ...over });

describe("handleSubmission", () => {
  it("stores a valid answer for the owner and notifies them", async () => {
    const r = await call();
    expect(r).toMatchObject({ status: 201, allowOrigin: ORIGIN });
    const list = await cloud.listSubmissions("alice", projectId);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ formKey: "booking", kind: "booking", lang: "am", data: { name: "Abebe" } });
    expect(notified).toHaveLength(1);
    expect(await cloud.listSubmissions("mallory", projectId)).toEqual([]);
    expect(list[0]!.status).toBe("new");
    expect(await cloud.setStatus("mallory", projectId, [list[0]!.id], "replied")).toBe(0);
    expect(await cloud.setStatus("alice", projectId, [list[0]!.id], "replied")).toBe(1);
    expect((await cloud.listSubmissions("alice", projectId))[0]).toMatchObject({ status: "replied", readAt: expect.any(Date) });
  });

  it("sends Telegram alerts only on a plan that includes them; the answer is stored either way", async () => {
    alerts = false;
    expect((await call()).status).toBe(201);
    expect(notified).toHaveLength(0);
    expect(await cloud.listSubmissions("alice", projectId)).toHaveLength(1);
    // After an upgrade the same owner is alerted again, nothing to relink.
    alerts = true;
    expect((await call({ ip: "2.2.2.2" })).status).toBe(201);
    expect(notified).toHaveLength(1);
    expect(await cloud.listSubmissions("alice", projectId)).toHaveLength(2);
  });

  it("sends no alert when the plan can't be read (fails closed)", async () => {
    delete deps.entitlements;
    expect((await call()).status).toBe(201);
    expect(notified).toHaveLength(0);
  });

  it("refuses answers while the owner has the site offline", async () => {
    await sites.setOffline("alice", projectId, true);
    expect(await call()).toMatchObject({ status: 404, body: { error: "offline" } });
    await sites.setOffline("alice", projectId, false);
    expect((await call()).status).toBe(201);
  });

  it("refuses other origins, wrong keys, unknown sites and forms", async () => {
    expect((await call({ origin: "https://evil.example" })).status).toBe(403);
    expect((await call({ origin: null })).status).toBe(403);
    expect((await call({ siteKey: "wrong" })).status).toBe(403);
    expect((await call({ projectId: "00000000-0000-0000-0000-000000000000" })).status).toBe(404);
    expect((await call({ formKey: "order" })).status).toBe(404);
  });

  it("validates answers", async () => {
    const r = await call({ body: { ...good(), answers: { name: "A", phone: "x", date: "2026-12-01" } } });
    expect(r).toMatchObject({ status: 422, body: { field: "phone" } });
  });

  it("quietly drops bot submissions", async () => {
    expect((await call({ body: { ...good(), _hp: "spam" } })).status).toBe(200);
    expect((await call({ body: { ...good(), _ms: 200 } })).status).toBe(200);
    expect(await cloud.listSubmissions("alice", projectId)).toEqual([]);
  });

  it("doesn't count bot hits against the site's allowance", async () => {
    deps.limits = { perSitePerDay: 2, perIpPerMinute: 100 };
    for (let i = 0; i < 5; i++) await call({ body: { ...good(), _hp: "x" }, ip: `9.9.9.${i}` });
    expect((await call()).status).toBe(201);
  });

  it("treats an IPv6 /64 as one visitor", async () => {
    for (let i = 0; i < 5; i++) expect((await call({ ip: `2001:db8:1:2::${i}` })).status).toBe(201);
    expect((await call({ ip: "2001:db8:1:2::ff" })).status).toBe(429);
  });

  it("rate limits per visitor", async () => {
    for (let i = 0; i < 5; i++) expect((await call()).status).toBe(201);
    expect((await call()).status).toBe(429);
    expect((await call({ ip: "2.2.2.2" })).status).toBe(201);
  });
});

describe("dashboard counts", () => {
  it("counts exactly per owner, and per Addis Ababa day in the database", async () => {
    expect(await cloud.countSubmissions("alice", projectId)).toEqual({ total: 0, waiting: 0 });
    await call();
    await call({ ip: "2.2.2.2" });
    const [first] = await cloud.listSubmissions("alice", projectId, 1);
    await cloud.setStatus("alice", projectId, [first!.id], "done");
    expect(await cloud.countSubmissions("alice", projectId)).toEqual({ total: 2, waiting: 1 });
    // Another owner sees nothing of alice's.
    expect(await cloud.countSubmissions("bob", projectId)).toEqual({ total: 0, waiting: 0 });
    expect(await cloud.answersPerDay("bob", projectId, new Date(0))).toEqual([]);
    const today = new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);
    expect(await cloud.answersPerDay("alice", projectId, new Date(Date.now() - 86_400_000))).toEqual([{ day: today, count: 2 }]);
  });
});

describe("getForms", () => {
  it("reads several forms of a site at once, skipping unknown keys", async () => {
    const site = (await cloud.publicSite(projectId))!;
    expect((await cloud.getForms(site.siteId, ["booking", "nope"])).map((f) => f.id)).toEqual(["booking"]);
    expect(await cloud.getForms(site.siteId, [])).toEqual([]);
  });
});

describe("message status and delete", () => {
  it("moves New → Replied → Done, refuses moves that aren't allowed, and reopens", async () => {
    await call();
    const [m] = await cloud.listSubmissions("alice", projectId, 1);
    expect(await cloud.setStatus("alice", projectId, [m!.id], "new")).toBe(0);
    expect(await cloud.setStatus("alice", projectId, [m!.id], "replied")).toBe(1);
    expect(await cloud.setStatus("alice", projectId, [m!.id], "done")).toBe(1);
    expect(await cloud.setStatus("alice", projectId, [m!.id], "replied")).toBe(0);
    expect(await cloud.setStatus("alice", projectId, [m!.id], "new")).toBe(1);
    expect((await cloud.listSubmissions("alice", projectId, 1))[0]!.status).toBe("new");
  });

  it("deletes one message, only for its owner", async () => {
    await call();
    await call({ ip: "2.2.2.2" });
    const [m] = await cloud.listSubmissions("alice", projectId, 1);
    expect(await cloud.deleteSubmission("bob", projectId, m!.id)).toBe(false);
    expect(await cloud.deleteSubmission("alice", projectId, m!.id)).toBe(true);
    expect(await cloud.deleteSubmission("alice", projectId, m!.id)).toBe(false);
    expect(await cloud.countSubmissions("alice", projectId)).toEqual({ total: 1, waiting: 1 });
  });
});

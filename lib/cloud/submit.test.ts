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
let projectId: string;
let siteKey: string;
const notified: Submission[] = [];

beforeEach(async () => {
  const db = await testDb();
  await makeUser(db, "alice");
  const store = new DbProjectStore(db);
  const sites = new DbSiteStore(db);
  cloud = new DbCloudStore(db);
  const p = await store.createProject("alice", { name: "Selam", locale: "en" });
  projectId = p.id;
  await sites.reserve("alice", p.id, "selam", "vercel");
  const site = await sites.savePublished("alice", { projectId: p.id, slug: "selam", provider: "vercel", providerProjectId: "prj", url: ORIGIN, publishedVersion: 1, lastDeploymentId: "d", publishedAt: new Date() });
  siteKey = site.siteKey!;
  await cloud.saveForms(site.id, extractForms(readFileSync("templates/site/src/site.json", "utf8")));
  notified.length = 0;
  deps = { cloud, limiter: new MemoryRateLimiter(), notifier: { notify: async (s) => void notified.push(s) } };
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
    await cloud.markRead("alice", projectId, [list[0]!.id]);
    expect((await cloud.listSubmissions("alice", projectId))[0]!.readAt).not.toBeNull();
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

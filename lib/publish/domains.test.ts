import { describe, expect, it } from "vitest";
import { FREE } from "@/lib/billing/entitlements";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { VercelPublishProvider } from "@/lib/providers/publish/vercel";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { normalizeDomain, routingRecord } from "@/lib/sites/domain";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { connectDomain, domainStatus } from "./domains";
import { publishSite } from "./service";

async function setup(customDomain: boolean) {
  const deps = {
    store: new MemoryProjectStore(),
    sites: new MemorySiteStore(),
    sandboxes: new MemorySandboxProvider({ "src/site.ts": `name: { en: "A" }` }),
    publisher: new MemoryPublishProvider(),
    lock: new MemoryLock(),
    appUrl: "https://gojoline.com",
    entitlements: async () => ({ ...FREE, customDomain }),
  };
  const p = await deps.store.createProject("alice", { name: "A", locale: "en" });
  await deps.store.addVersion("alice", { projectId: p.id, summary: "v1", files: { "src/site.ts": `name: { en: "A" }` } });
  return { deps, p };
}

describe("custom domains", () => {
  it("normalizes and rejects bad or reserved domains", () => {
    expect(normalizeDomain("https://WWW.SelamCoffee.com/")).toBe("www.selamcoffee.com");
    for (const bad of ["localhost", "a", "x.gojoline.com", "evil.vercel.app", "selam coffee.com", "-a.com"]) expect(normalizeDomain(bad)).toBeNull();
  });

  it("uses A for apex and CNAME for subdomains", () => {
    expect(routingRecord("selam.et", "selam.et")).toEqual({ type: "A", name: "@", value: "76.76.21.21" });
    expect(routingRecord("www.selam.et", "selam.et")).toEqual({ type: "CNAME", name: "www", value: "cname.vercel-dns.com" });
  });

  it("is a paid feature", async () => {
    const { deps, p } = await setup(false);
    await publishSite(deps, { id: "alice", verified: true }, p.id, "aaa-site");
    expect(await connectDomain(deps, "alice", p.id, "selam.et")).toEqual({ ok: false, error: "plan_required" });
  });

  it("needs a published site, then returns DNS records; one site per domain", async () => {
    const { deps, p } = await setup(true);
    expect(await connectDomain(deps, "alice", p.id, "selam.et")).toEqual({ ok: false, error: "not_published" });
    await publishSite(deps, { id: "alice", verified: true }, p.id, "aaa-site");
    const r = await connectDomain(deps, "alice", p.id, "www.selam.et");
    expect(r).toMatchObject({ ok: true, domain: "www.selam.et", status: { status: "pending" } });
    expect(await domainStatus(deps, "alice", p.id)).toMatchObject({ ok: true, domain: "www.selam.et" });
    expect(await domainStatus(deps, "bob", p.id)).toBeNull();
  });

  it("releases a claim nobody verified within 7 days, but never a verified one", async () => {
    const { deps, p } = await setup(true);
    await publishSite(deps, { id: "alice", verified: true }, p.id, "aaa-site");
    await connectDomain(deps, "alice", p.id, "selam.et");
    const q = await deps.store.createProject("bob", { name: "B", locale: "en" });
    await deps.store.addVersion("bob", { projectId: q.id, summary: "v1", files: { "src/site.ts": `name: { en: "B" }` } });
    await publishSite(deps, { id: "bob", verified: true }, q.id, "bbb-site");
    expect(await connectDomain(deps, "bob", q.id, "selam.et")).toEqual({ ok: false, error: "domain_in_use" });

    const aliceSite = (await deps.sites.getByProject("alice", p.id))!;
    aliceSite.customDomainClaimedAt = new Date(Date.now() - 8 * 86_400_000);
    // A failed attempt by alice on another domain must not refresh her old claim.
    expect(await connectDomain(deps, "alice", p.id, "localhost")).toEqual({ ok: false, error: "invalid_domain" });
    expect(await connectDomain(deps, "bob", q.id, "selam.et")).toMatchObject({ ok: true, domain: "selam.et" });
    expect(deps.publisher.removedDomains).toEqual(["selam.et"]);
    expect((await deps.sites.getByProject("alice", p.id))?.customDomain).toBeNull();

    // Verified claims stay, however old.
    const bobSite = (await deps.sites.getByProject("bob", q.id))!;
    bobSite.customDomainClaimedAt = new Date(Date.now() - 30 * 86_400_000);
    bobSite.customDomainVerifiedAt = new Date(Date.now() - 29 * 86_400_000);
    expect(await connectDomain(deps, "alice", p.id, "selam.et")).toEqual({ ok: false, error: "domain_in_use" });
  });

  it("Vercel provider: reports TXT verification and routing records", async () => {
    const calls: string[] = [];
    const fake = (async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method} ${new URL(url).pathname}`);
      const body = url.includes("/v10/projects/")
        ? { name: "www.selam.et", apexName: "selam.et", verified: false, verification: [{ type: "TXT", domain: "_vercel.selam.et", value: "vc-domain-verify=abc" }] }
        : {};
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch;
    const provider = new VercelPublishProvider({ token: "t", teamId: "team_1", fetchImpl: fake });
    const status = await provider.addDomain("prj_1", "www.selam.et");
    expect(status.status).toBe("pending");
    expect(status.records).toEqual([
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
      { type: "TXT", name: "_vercel", value: "vc-domain-verify=abc" },
    ]);
    expect(calls).toEqual(["POST /v10/projects/prj_1/domains"]);
  });
});

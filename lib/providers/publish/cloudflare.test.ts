import { describe, expect, it } from "vitest";
import { MemoryStorageProvider } from "@/lib/providers/storage/memory";
import { CloudflarePublishProvider, apexOf } from "./cloudflare";

const file = (path: string, s = path) => ({ path, data: Buffer.from(s) });
const headers = [{ key: "X-Frame-Options", value: "DENY" }];

function setup(api: (method: string, path: string, body: unknown) => { status?: number; body: unknown } = () => ({ body: { success: true, result: null } })) {
  const storage = new MemoryStorageProvider();
  const calls: { method: string; path: string; body: unknown }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const path = url.replace("https://api.cloudflare.com/client/v4", "");
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method: init.method ?? "GET", path, body });
    const r = api(init.method ?? "GET", path, body);
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
  }) as unknown as typeof fetch;
  const cf = new CloudflarePublishProvider({ storage, baseDomain: "afridea.et", apiToken: "t", zoneId: "z1", fetchImpl });
  return { storage, cf, calls };
}

const json = (storage: MemoryStorageProvider, key: string) => JSON.parse(storage.objects.get(key)!.data.toString());

describe("CloudflarePublishProvider", () => {
  it("publishes files under a new deployment, then points the site and its host at it", async () => {
    const { storage, cf } = setup();
    const r = await cf.publish({ slug: "abeni", files: [file("index.html"), file("assets/a.js"), file("../evil.html"), file("/abs.html")], headers });
    expect(r.url).toBe("https://abeni.afridea.et");
    expect(r.providerProjectId).toBe("cf:abeni");
    expect(json(storage, "sites/abeni/current.json")).toEqual({ deployment: r.deploymentId, headers });
    expect(json(storage, "hosts/abeni.afridea.et.json")).toEqual({ site: "abeni" });
    expect(storage.objects.get(`sites/abeni/d/${r.deploymentId}/index.html`)?.contentType).toBe("text/html; charset=utf-8");
    expect([...storage.objects.keys()].filter((k) => k.includes("evil") || k.includes("abs"))).toEqual([]);
  });

  it("keeps the previous deployment and drops older ones; a takedown keeps only the current one", async () => {
    const { storage, cf } = setup();
    const a = await cf.publish({ slug: "abeni", files: [file("index.html", "a")], headers });
    await new Promise((r) => setTimeout(r, 2));
    const b = await cf.publish({ slug: "abeni", files: [file("index.html", "b")], headers, providerProjectId: "cf:abeni" });
    await new Promise((r) => setTimeout(r, 2));
    const c = await cf.publish({ slug: "abeni", files: [file("index.html", "c")], headers, providerProjectId: "cf:abeni" });
    const deployments = () => new Set([...storage.objects.keys()].filter((k) => k.startsWith("sites/abeni/d/")).map((k) => k.split("/")[3]));
    expect(deployments()).toEqual(new Set([b.deploymentId, c.deploymentId]));
    expect(deployments().has(a.deploymentId)).toBe(false);
    await cf.restrictOldDeployments("cf:abeni");
    expect(deployments()).toEqual(new Set([c.deploymentId]));
  });

  it("never takes over another site's files or address", async () => {
    const { storage, cf } = setup();
    await cf.publish({ slug: "abeni", files: [file("index.html")], headers });
    await expect(cf.publish({ slug: "abeni", files: [file("index.html")], headers })).rejects.toThrow("slug_taken");
    await expect(cf.publish({ slug: "abeni", files: [file("index.html")], headers, providerProjectId: "cf:other" })).rejects.toThrow();
    await storage.put("hosts/kebede.afridea.et.json", JSON.stringify({ site: "someone" }));
    await expect(cf.publish({ slug: "kebede", files: [file("index.html")], headers, providerProjectId: "cf:kebede" })).rejects.toThrow("slug_taken");
  });

  it("moves a site from the Vercel fallback (saved non-Cloudflare ID)", async () => {
    const { cf } = setup();
    await cf.publish({ slug: "abeni", files: [file("index.html")], headers });
    const r = await cf.publish({ slug: "abeni", files: [file("index.html")], headers, providerProjectId: "prj_vercel123" });
    expect(r.providerProjectId).toBe("cf:abeni");
  });

  it("connects a domain as a custom hostname and maps it to the site", async () => {
    const { storage, cf, calls } = setup((method) =>
      method === "POST"
        ? { body: { success: true, result: { id: "h1", hostname: "www.abeni.com.et", status: "pending", ssl: { status: "pending_validation" }, ownership_verification: { type: "txt", name: "_cf-custom-hostname.www.abeni.com.et", value: "abc" } } } }
        : { body: { success: true, result: [] } },
    );
    const s = await cf.addDomain("cf:abeni", "www.abeni.com.et");
    expect(calls[0]).toMatchObject({ method: "POST", path: "/zones/z1/custom_hostnames", body: { hostname: "www.abeni.com.et", ssl: { method: "http", type: "dv" } } });
    expect(s).toEqual({
      status: "pending",
      records: [
        { type: "CNAME", name: "www", value: "domains.afridea.et" },
        { type: "TXT", name: "_cf-custom-hostname.www", value: "abc" },
      ],
    });
    expect(json(storage, "hosts/www.abeni.com.et.json")).toEqual({ site: "abeni" });
  });

  it("refuses our own subdomains and domains mapped to another site", async () => {
    const { storage, cf } = setup();
    await expect(cf.addDomain("cf:abeni", "gojoline.afridea.et")).rejects.toThrow("domain_in_use");
    await storage.put("hosts/taken.com.json", JSON.stringify({ site: "other" }));
    await expect(cf.addDomain("cf:abeni", "taken.com")).rejects.toThrow("domain_in_use");
  });

  it("reports active once Cloudflare has the hostname and certificate, and removes it", async () => {
    const hostname = { id: "h9", hostname: "abeni.com", status: "active", ssl: { status: "active" } };
    const { storage, cf, calls } = setup((method) => (method === "GET" ? { body: { success: true, result: [hostname] } } : { body: { success: true, result: {} } }));
    await storage.put("hosts/abeni.com.json", JSON.stringify({ site: "abeni" }));
    expect((await cf.checkDomain("cf:abeni", "abeni.com")).status).toBe("active");
    expect((await cf.checkDomain("cf:abeni", "abeni.com")).records[0]).toEqual({ type: "CNAME", name: "@", value: "domains.afridea.et" });
    await expect(cf.checkDomain("cf:other", "abeni.com")).rejects.toThrow("domain_missing");
    await cf.removeDomain("cf:abeni", "abeni.com");
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", path: "/zones/z1/custom_hostnames/h9" });
    expect(storage.objects.has("hosts/abeni.com.json")).toBe(false);
  });

  it("finds the registrable domain", () => {
    expect(apexOf("www.abeni.com.et")).toBe("abeni.com.et");
    expect(apexOf("shop.abeni.et")).toBe("abeni.et");
    expect(apexOf("abeni.com")).toBe("abeni.com");
  });
});

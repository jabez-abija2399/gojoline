import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

type Call = { method: string; path: string; body: string };

/** A fake Cloudflare API with the zone as it is today: a wildcard to Vercel, DNS only. */
function fakeApi() {
  const calls: Call[] = [];
  const records = [
    { id: "r1", type: "A", name: "afridea.et", content: "216.198.79.1", proxied: false },
    { id: "r2", type: "A", name: "*.afridea.et", content: "64.29.17.1", proxied: false },
    { id: "r3", type: "MX", name: "afridea.et", content: "route1.mx.cloudflare.net", proxied: false },
  ];
  const ok = (result: unknown) => JSON.stringify({ success: true, result, result_info: { total_pages: 1 } });
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const path = req.url!.replace(/[?&]per_page=100&page=1$/, "");
      calls.push({ method: req.method!, path, body });
      const vercel = req.url!.startsWith("/v9/");
      if (vercel && req.headers.authorization !== "Bearer good") {
        res.statusCode = 403;
        return res.end(JSON.stringify({ error: { message: "forbidden" } }));
      }
      if (vercel && req.url!.startsWith("/v9/projects?")) {
        const page2 = req.url!.includes("until=");
        return res.end(JSON.stringify(page2 ? { projects: [{ id: "p2" }], pagination: { next: null } } : { projects: [{ id: "p1" }], pagination: { next: 123 } }));
      }
      if (vercel && req.url!.startsWith("/v9/projects/p1/domains")) return res.end(JSON.stringify({ domains: [{ name: "*.afridea.et" }, { name: "gojoline.afridea.et" }], pagination: { next: null } }));
      if (vercel && req.url!.startsWith("/v9/projects/p2/domains")) return res.end(JSON.stringify({ domains: [{ name: "shop.afridea.et" }], pagination: { next: null } }));
      if (path === "/user/tokens/verify") return res.end(ok({ status: "active" }));
      if (path.startsWith("/zones?name=")) return res.end(ok([{ id: "z1", plan: { name: "Free" } }]));
      if (path === "/accounts/acc/r2/buckets/gojoline") return res.end(ok({ name: "gojoline" }));
      if (path === "/zones/z1/dns_records" && req.method === "GET") return res.end(ok(records));
      if (path === "/zones/z1/workers/routes" && req.method === "GET") return res.end(ok([]));
      if (path.endsWith("/fallback_origin") && req.method === "GET") return res.end(JSON.stringify({ success: false, errors: [{ code: 1, message: "none" }] }));
      res.end(ok({}));
    });
  });
  return { calls, server };
}

let server: Server | null = null;
afterEach(() => server?.close());

async function run(args: string[], extraEnv: Record<string, string> = {}) {
  const api = fakeApi();
  server = api.server;
  await new Promise<void>((r) => api.server.listen(0, "127.0.0.1", r));
  const port = (api.server.address() as AddressInfo).port;
  const out = await new Promise<string>((resolve, reject) =>
    execFile(
      process.execPath,
      ["scripts/cloudflare-setup.mjs", ...args],
      { env: { NODE_ENV: "test", PATH: process.env.PATH, CLOUDFLARE_API_BASE: `http://127.0.0.1:${port}`, CLOUDFLARE_API_TOKEN: "t", R2_ACCOUNT_ID: "acc", PUBLISH_BASE_DOMAIN: "afridea.et", NEXT_PUBLIC_APP_URL: "https://gojoline.afridea.et", VERCEL_API_BASE: `http://127.0.0.1:${port}`, ...extraEnv } },
      (err: Error | null, stdout: string, stderr: string) => (err ? reject(new Error(`${err.message}\n${stdout}\n${stderr}`)) : resolve(stdout)),
    ),
  );
  return { out, calls: api.calls };
}

describe("cloudflare-setup", () => {
  it("changes nothing without --apply", async () => {
    const { out, calls } = await run([]);
    expect(calls.filter((c) => c.method !== "GET")).toEqual([]);
    expect(out).toContain("would add gojoline.afridea.et CNAME cname.vercel-dns.com");
    expect(out).toContain("would proxy *.afridea.et");
  }, 20_000);

  it("keeps the app on Vercel before proxying the wildcard, then routes only site traffic to the Worker", async () => {
    const { calls } = await run(["--apply"]);
    const writes = calls.filter((c) => c.method !== "GET");
    const keep = writes.findIndex((c) => c.method === "POST" && c.path === "/zones/z1/dns_records" && c.body.includes('"name":"gojoline.afridea.et"') && c.body.includes('"proxied":false'));
    const proxy = writes.findIndex((c) => c.method === "PATCH" && c.path === "/zones/z1/dns_records/r2");
    expect(keep).toBeGreaterThanOrEqual(0);
    expect(proxy).toBeGreaterThan(keep);
    expect(writes.some((c) => c.method === "PUT" && c.path === "/accounts/acc/workers/scripts/gojoline-sites" && c.body.includes('"bucket_name":"gojoline"'))).toBe(true);
    const routes = writes.filter((c) => c.path === "/zones/z1/workers/routes").map((c) => JSON.parse(c.body));
    expect(routes).toEqual(
      expect.arrayContaining([
        { pattern: "*.afridea.et/*", script: "gojoline-sites" },
        { pattern: "*/*", script: "gojoline-sites" },
        { pattern: "afridea.et/*" },
        { pattern: "gojoline.afridea.et/*" },
      ]),
    );
    expect(writes.some((c) => c.method === "DELETE")).toBe(false);
  }, 20_000);

  it("keeps every Vercel-served name (all pages, wildcards skipped) and stops on a Vercel error", async () => {
    const { calls } = await run(["--apply"], { VERCEL_TOKEN: "good", VERCEL_TEAM_ID: "team" });
    const added = calls.filter((c) => c.method === "POST" && c.path === "/zones/z1/dns_records").map((c) => JSON.parse(c.body).name);
    expect(added).toEqual(expect.arrayContaining(["gojoline.afridea.et", "shop.afridea.et"]));
    expect(added).not.toContain("*.afridea.et");
    await expect(run(["--apply"], { VERCEL_TOKEN: "bad", VERCEL_TEAM_ID: "team" })).rejects.toThrow(/Vercel/);
  }, 20_000);
});

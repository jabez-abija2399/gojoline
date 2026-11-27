// Smoke test of the customer-site serving rules (deploy/server/Caddyfile) against what the
// server publisher writes: a small Node server that mirrors the Caddy rules step by step, over
// real HTTP, on a temporary sites folder. (Caddy itself is checked on the server: README.md.)
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ServerPublishProvider } from "@/lib/providers/publish/server";
import { publishedSiteHeaders } from "@/lib/publish/scan";

const isFile = (p: string) => stat(p).then((s) => s.isFile(), () => false);
const isDir = (p: string) => stat(p).then((s) => s.isDirectory(), () => false);

/** The Caddyfile's `*.{$PUBLISH_BASE_DOMAIN}` block, rule for rule. */
async function serve(root: string, host: string, method: string, rawPath: string): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const headers: Record<string, string> = Object.fromEntries(publishedSiteHeaders({ dataApiOrigin: "https://gojoline.afridea.et" }).map((h) => [h.key, h.value]));
  const site = /^([a-z0-9][a-z0-9-]{1,38}[a-z0-9])\./.exec(host)?.[1] ?? "-";
  const path = decodeURIComponent(rawPath.split("?")[0]!);
  if (path.split("/").includes("..")) return { status: 400, headers, body: "" };
  if (method !== "GET" && method !== "HEAD") return { status: 405, headers, body: "" };
  const slash = /^(\/.*[^/])\/+$/.exec(path);
  if (slash) return { status: 308, headers: { ...headers, Location: slash[1]! }, body: "" };
  if (!(await isFile(join(root, site, "current", "index.html")))) return { status: 404, headers: { ...headers, "Cache-Control": "no-store" }, body: "There's no site at this address" };
  if ((await isFile(join(root, site, "resting.html"))) && !(await isFile(join(root, site, "takedown.flag"))) && /(?:\/[^/.]*|\.html)$/.test(path)) {
    return { status: 503, headers: { ...headers, "Cache-Control": "no-store", "Retry-After": "86400" }, body: await readFile(join(root, site, "resting.html"), "utf8") };
  }
  const dir = join(root, site, "current");
  let cache = "public, max-age=0, must-revalidate";
  if (path.startsWith("/assets/")) cache = "public, max-age=31536000, immutable";
  for (const candidate of [path, `${path}/index.html`, `${path}.html`]) {
    if (candidate.split("/").some((p) => p.startsWith("."))) continue; // hide .*
    const full = join(dir, candidate);
    if (candidate.endsWith("/") ? await isDir(full) : await isFile(full)) {
      return { status: 200, headers: { ...headers, "Cache-Control": cache }, body: await readFile(candidate.endsWith("/") ? join(full, "index.html") : full, "utf8") };
    }
  }
  const notFound = join(dir, "404.html");
  return (await isFile(notFound)) ? { status: 404, headers: { ...headers, "Cache-Control": "public, max-age=0, must-revalidate" }, body: await readFile(notFound, "utf8") } : { status: 404, headers, body: "" };
}

let dir: string;
let server: Server;
let base: string;
let host: ServerPublishProvider;
const get = (slug: string, path: string, method = "GET") => fetch(`${base}${path}`, { method, headers: { "x-host": `${slug}.afridea.et` }, redirect: "manual" });

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "serve-"));
  host = new ServerPublishProvider({ sitesDir: dir, baseDomain: "afridea.et" });
  server = createServer(async (req, res) => {
    const r = await serve(dir, String(req.headers["x-host"]), req.method ?? "GET", req.url ?? "/");
    res.writeHead(r.status, r.headers).end(req.method === "HEAD" ? undefined : r.body);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const f = (path: string, s: string) => ({ path, data: Buffer.from(s) });
  await host.publish({ slug: "bole-cafe", headers: [], files: [f("index.html", "home"), f("about/index.html", "about"), f("404.html", "own 404"), f("assets/index-abc.js", "js")] });
});
afterAll(async () => {
  server.close();
  await rm(dir, { recursive: true, force: true });
});

describe("serving customer sites (Caddy rules, mirrored)", () => {
  it("serves pages with clean URLs, the site's 404, and security headers", async () => {
    const home = await get("bole-cafe", "/");
    expect([home.status, await home.text()]).toEqual([200, "home"]);
    expect(home.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(home.headers.get("x-content-type-options")).toBe("nosniff");
    expect(home.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    expect(await (await get("bole-cafe", "/about")).text()).toBe("about");
    const slash = await get("bole-cafe", "/about/");
    expect([slash.status, slash.headers.get("location")]).toEqual([308, "/about"]);
    const js = await get("bole-cafe", "/assets/index-abc.js");
    expect(js.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    const missing = await get("bole-cafe", "/nope");
    expect([missing.status, await missing.text()]).toEqual([404, "own 404"]);
    expect((await get("bole-cafe", "/", "POST")).status).toBe(405);
    expect((await get("other-site", "/")).status).toBe(404);
    expect((await get("bole-cafe", "/state.json")).status).toBe(404);
  });

  it("rests pages but not files, and the takedown notice wins", async () => {
    await host.setResting("srv:bole-cafe", true);
    const page = await get("bole-cafe", "/about");
    expect(page.status).toBe(503);
    expect(page.headers.get("retry-after")).toBe("86400");
    expect(await page.text()).toContain("This site is resting");
    expect((await get("bole-cafe", "/assets/index-abc.js")).status).toBe(200);
    await host.setResting("srv:bole-cafe", false);
    expect((await get("bole-cafe", "/")).status).toBe(200);

    await host.setResting("srv:bole-cafe", true);
    await host.publish({ slug: "bole-cafe", headers: [], providerProjectId: "srv:bole-cafe", takedown: true, files: [{ path: "index.html", data: Buffer.from("notice") }, { path: "404.html", data: Buffer.from("notice") }] });
    for (const p of ["/", "/about"]) expect(await (await get("bole-cafe", p)).text()).toBe("notice");
  });
});

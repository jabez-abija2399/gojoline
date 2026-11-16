import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getMessages } from "@/lib/i18n";
import worker, { browserCache, candidates, clearCache, etagMatches, TEXT, type Env, type R2ObjectLike } from "./worker";

function bucket(files: Record<string, string>, reads: string[] = []): Env["SITES"] {
  return {
    async get(key: string): Promise<R2ObjectLike | null> {
      reads.push(key);
      const v = files[key];
      if (v === undefined) return null;
      return { body: new Response(v).body, httpEtag: `"e${v.length}"`, size: Buffer.byteLength(v), text: async () => v };
    },
  };
}

const D = "d2abc123";
const pointer = (extra: object = {}) => JSON.stringify({ deployment: D, headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Bad\nKey", value: "x" }, { key: "Set-Cookie", value: "a=1; Domain=afridea.et" }], ...extra });
const FILES = ["index.html", "about/index.html", "assets/app-1.js", "404.html"];
function env(opts: { extra?: Record<string, string>; reads?: string[]; withList?: boolean; base?: boolean } = {}): Env {
  return {
    APP_URL: "https://gojoline.afridea.et",
    BASE_DOMAIN: opts.base === false ? undefined : "afridea.et",
    SITES: bucket(
      {
        "hosts/abeni.afridea.et.json": JSON.stringify({ site: "abeni" }),
        "hosts/www.abeni-cafe.com.json": JSON.stringify({ site: "abeni" }),
        "hosts/kebede.afridea.et.json": JSON.stringify({ site: "someone-else" }),
        "sites/kebede/current.json": pointer({ files: FILES }),
        "sites/abeni/current.json": pointer(opts.withList === false ? {} : { files: FILES }),
        [`sites/abeni/d/${D}/index.html`]: "<h1>home</h1>",
        [`sites/abeni/d/${D}/about/index.html`]: "<h1>about</h1>",
        [`sites/abeni/d/${D}/assets/app-1.js`]: "js",
        [`sites/abeni/d/${D}/404.html`]: "<h1>missing</h1>",
        "sites/abeni/d/d1old000/secret.html": "old",
        ...opts.extra,
      },
      opts.reads,
    ),
  };
}

const get = (url: string, e = env(), init: RequestInit = {}) => worker.fetch(new Request(url, init), e);

describe("sites worker", () => {
  beforeEach(() => clearCache());

  it("serves the current deployment by host, with the site's headers", async () => {
    const res = await get("https://abeni.afridea.et/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<h1>home</h1>");
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("cache-control")).toContain("must-revalidate");
  });

  it("finds pages from the file list without missing on R2", async () => {
    const reads: string[] = [];
    const e = env({ reads });
    expect(await (await get("https://abeni.afridea.et/about", e)).text()).toBe("<h1>about</h1>");
    expect(reads.filter((k) => k.includes("/d/"))).toEqual([`sites/abeni/d/${D}/about/index.html`]);
    reads.length = 0;
    expect((await get("https://abeni.afridea.et/nope", e)).status).toBe(404);
    expect(reads).toEqual([`sites/abeni/d/${D}/404.html`]);
  });

  it("still serves sites published before the file list (probing, page form first)", async () => {
    const reads: string[] = [];
    const e = env({ reads, withList: false });
    expect(await (await get("https://abeni.afridea.et/about", e)).text()).toBe("<h1>about</h1>");
    expect(reads.filter((k) => k.includes("/d/"))).toEqual([`sites/abeni/d/${D}/about/index.html`]);
    expect(await (await get("https://abeni.afridea.et/nope", e)).text()).toBe("<h1>missing</h1>");
  });

  it("serves connected domains and long-lived assets", async () => {
    expect(await (await get("https://www.abeni-cafe.com/about")).text()).toBe("<h1>about</h1>");
    const asset = await get("https://abeni.afridea.et/assets/app-1.js");
    expect(asset.headers.get("cache-control")).toContain("immutable");
    expect(asset.headers.get("content-type")).toContain("javascript");
  });

  it("refuses a subdomain whose mapping belongs to another site", async () => {
    expect((await get("https://kebede.afridea.et/")).status).toBe(404);
  });

  it("redirects a trailing slash before any lookup, and answers 304 for weak and strong ETags", async () => {
    const reads: string[] = [];
    const r = await get("https://abeni.afridea.et/about/?x=1", env({ reads }));
    expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("https://abeni.afridea.et/about?x=1");
    expect(reads).toEqual([]);
    const first = await get("https://abeni.afridea.et/");
    const etag = first.headers.get("etag")!;
    expect((await get("https://abeni.afridea.et/", env(), { headers: { "if-none-match": etag } })).status).toBe(304);
    expect((await get("https://abeni.afridea.et/", env(), { headers: { "if-none-match": `"x", W/${etag}` } })).status).toBe(304);
  });

  it("uses the site's 404 page, and never serves older deployments or odd paths", async () => {
    const r = await get("https://abeni.afridea.et/secret");
    expect(r.status).toBe(404);
    expect(await r.text()).toBe("<h1>missing</h1>");
    expect((await get("https://abeni.afridea.et/..%2F..%2Fd1old000/secret.html")).status).toBe(400);
    expect((await get("https://abeni.afridea.et/%E0%A4%A")).status).toBe(400);
  });

  it("shows a bilingual page for unknown hosts and refuses writes", async () => {
    const r = await get("https://nobody.afridea.et/");
    expect(r.status).toBe(404);
    expect(r.headers.get("x-robots-tag")).toBe("noindex");
    const html = await r.text();
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<section lang="am"><h2>በዚህ አድራሻ ድረ-ገጽ የለም</h2>');
    expect(html).toContain('href="https://gojoline.afridea.et/am"');
    expect((await get("https://abeni.afridea.et/", env(), { method: "POST" })).status).toBe(405);
  });

  it("passes on only the publishing security headers (never cookies or odd names)", async () => {
    const r = await get("https://abeni.afridea.et/");
    expect([...r.headers.keys()].some((k) => k.includes("bad"))).toBe(false);
    expect(r.headers.get("set-cookie")).toBeNull();
  });

  it("allows every header publishing actually sets", async () => {
    const { publishedSiteHeaders } = await import("@/lib/publish/scan");
    const all = publishedSiteHeaders({ dataApiOrigin: "https://api.example" });
    const e = env({ extra: { "sites/abeni/current.json": JSON.stringify({ deployment: D, headers: all, files: FILES }) } });
    const r = await get("https://abeni.afridea.et/", e);
    for (const h of all) expect(r.headers.get(h.key), h.key).toBe(h.value);
  });

  it("shows the resting page for pages while the owner has the site offline", async () => {
    const e = env({ extra: { "sites/abeni/current.json": pointer({ files: FILES, resting: true }) } });
    const r = await get("https://abeni.afridea.et/about", e);
    expect(r.status).toBe(503);
    expect(r.headers.get("retry-after")).toBe("86400");
    const html = await r.text();
    expect(html).toContain(TEXT.en.restingTitle);
    expect(html).toContain(TEXT.am.restingTitle);
    // Files (scripts, photos) still load; only pages rest.
    expect((await get("https://abeni.afridea.et/assets/app-1.js", e)).status).toBe(200);
  });

  it("serves a takedown notice even if the resting flag is still on", async () => {
    const e = env({ extra: { "sites/abeni/current.json": pointer({ files: FILES, resting: true, takedown: true }) } });
    const r = await get("https://abeni.afridea.et/", e);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("<h1>home</h1>");
  });

  it("keeps its page text equal to the app's messages", () => {
    for (const l of ["en", "am"] as const) {
      const m = getMessages(l).safety;
      for (const [k, v] of Object.entries(TEXT[l])) expect(v, `${l}.${k}`).toBe(m[k as keyof typeof m]);
    }
  });

  it("resolves paths, lifetimes and ETags", () => {
    expect(candidates("/")).toEqual(["index.html"]);
    expect(candidates("/am")).toEqual(["am/index.html", "am", "am.html"]);
    expect(candidates("/stock/a.webp")).toEqual(["stock/a.webp"]);
    expect(candidates("/a/../b")).toBeNull();
    expect(browserCache("fonts/x.woff2")).toContain("max-age=2592000");
    expect(browserCache("am/index.html")).toContain("max-age=0");
    expect(etagMatches("*", '"a"')).toBe(true);
    expect(etagMatches('W/"b"', '"a"')).toBe(false);
  });
});

describe("sites worker edge cache", () => {
  const store = new Map<string, Response>();
  beforeEach(() => {
    clearCache();
    store.clear();
    (globalThis as unknown as { caches: unknown }).caches = {
      default: { match: async (k: string) => store.get(k)?.clone(), put: async (k: string, r: Response) => void store.set(k, r) },
    };
  });
  afterEach(() => delete (globalThis as unknown as { caches?: unknown }).caches);

  it("serves repeat requests from the edge, keyed by deployment", async () => {
    const reads: string[] = [];
    const e = env({ reads });
    const waits: Promise<unknown>[] = [];
    await worker.fetch(new Request("https://abeni.afridea.et/about"), e, { waitUntil: (p) => void waits.push(p) });
    await Promise.all(waits);
    expect([...store.keys()]).toEqual([`https://sites-cache.internal/abeni/${D}/about/index.html`]);
    reads.length = 0;
    const again = await worker.fetch(new Request("https://abeni.afridea.et/about"), e);
    expect(await again.text()).toBe("<h1>about</h1>");
    expect(again.headers.get("cache-control")).toContain("max-age=0");
    expect(again.headers.get("x-frame-options")).toBe("DENY");
    expect(reads.filter((k) => k.includes("/d/"))).toEqual([]);
  });
});

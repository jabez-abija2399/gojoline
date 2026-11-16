import { beforeEach, describe, expect, it } from "vitest";
import worker, { candidates, clearCache, type Env, type R2ObjectLike } from "./worker";

function bucket(files: Record<string, string>): Env["SITES"] {
  return {
    async get(key: string): Promise<R2ObjectLike | null> {
      const v = files[key];
      if (v === undefined) return null;
      return { body: new Response(v).body, httpEtag: `"${v.length}"`, size: Buffer.byteLength(v), text: async () => v };
    },
  };
}

const env = (extra: Record<string, string> = {}): Env => ({
  APP_URL: "https://gojoline.afridea.et",
  SITES: bucket({
    "hosts/abeni.afridea.et.json": JSON.stringify({ site: "abeni" }),
    "hosts/www.abeni-cafe.com.json": JSON.stringify({ site: "abeni" }),
    "sites/abeni/current.json": JSON.stringify({ deployment: "d2abc123", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Bad\nKey", value: "x" }] }),
    "sites/abeni/d/d2abc123/index.html": "<h1>home</h1>",
    "sites/abeni/d/d2abc123/about/index.html": "<h1>about</h1>",
    "sites/abeni/d/d2abc123/assets/app-1.js": "js",
    "sites/abeni/d/d2abc123/404.html": "<h1>missing</h1>",
    "sites/abeni/d/d1old000/secret.html": "old",
    ...extra,
  }),
});

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

  it("serves connected domains and clean URLs", async () => {
    expect(await (await get("https://www.abeni-cafe.com/about")).text()).toBe("<h1>about</h1>");
    const asset = await get("https://abeni.afridea.et/assets/app-1.js");
    expect(asset.headers.get("cache-control")).toContain("immutable");
    expect(asset.headers.get("content-type")).toContain("javascript");
  });

  it("redirects a trailing slash and answers 304 for a matching ETag", async () => {
    const r = await get("https://abeni.afridea.et/about/?x=1");
    expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("https://abeni.afridea.et/about?x=1");
    const first = await get("https://abeni.afridea.et/");
    const again = await get("https://abeni.afridea.et/", env(), { headers: { "if-none-match": first.headers.get("etag")! } });
    expect(again.status).toBe(304);
  });

  it("uses the site's 404 page, and never serves older deployments or other paths", async () => {
    const r = await get("https://abeni.afridea.et/secret");
    expect(r.status).toBe(404);
    expect(await r.text()).toBe("<h1>missing</h1>");
    expect((await get("https://abeni.afridea.et/..%2F..%2Fd1old000/secret.html")).status).toBe(400);
    expect((await get("https://abeni.afridea.et/%E0%A4%A")).status).toBe(400);
  });

  it("shows a neutral page for unknown hosts and refuses writes", async () => {
    const r = await get("https://nobody.afridea.et/");
    expect(r.status).toBe(404);
    expect(r.headers.get("x-robots-tag")).toBe("noindex");
    expect((await get("https://abeni.afridea.et/", env(), { method: "POST" })).status).toBe(405);
  });

  it("drops header names that could split the response", async () => {
    const r = await get("https://abeni.afridea.et/");
    expect([...r.headers.keys()].some((k) => k.includes("bad"))).toBe(false);
  });

  it("resolves paths", () => {
    expect(candidates("/")).toEqual(["index.html"]);
    expect(candidates("/am")).toEqual(["am", "am.html", "am/index.html"]);
    expect(candidates("/stock/a.webp")).toEqual(["stock/a.webp"]);
    expect(candidates("/a/../b")).toBeNull();
  });
});

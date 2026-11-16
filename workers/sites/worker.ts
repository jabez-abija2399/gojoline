/**
 * Serves every published site from R2 (bucket bound as SITES). Deployed by
 * scripts/cloudflare-setup.mjs; no imports, so it uploads as a single module.
 *
 * Layout in the bucket (written by lib/providers/publish/cloudflare.ts):
 *   hosts/<hostname>.json           {"site":"<slug>"}   (<slug>.<base> and connected domains)
 *   sites/<slug>/current.json       {"deployment":"<id>","headers":[{key,value}]}
 *   sites/<slug>/d/<id>/<path>      the built files
 * Only the current deployment is ever served, so replacing it (a new publish or a takedown
 * notice) retires the old content everywhere at once.
 */

export interface R2ObjectLike {
  body: ReadableStream | null;
  httpEtag: string;
  size: number;
  text(): Promise<string>;
}
export interface R2BucketLike {
  get(key: string): Promise<R2ObjectLike | null>;
}
export interface Env {
  SITES: R2BucketLike;
  /** Shown on the "no site here" page. */
  APP_URL?: string;
}

interface Pointer {
  deployment: string;
  headers: { key: string; value: string }[];
}

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json",
  webmanifest: "application/manifest+json",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  pdf: "application/pdf",
  mp4: "video/mp4",
};

export const contentType = (path: string) => TYPES[/\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase() ?? ""] ?? "application/octet-stream";

/** Where to look for a request path, in order (clean URLs: /about → about.html or about/index.html). */
export function candidates(pathname: string): string[] | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (path.includes("\0") || path.includes("\\") || path.split("/").some((p) => p === ".." || p === ".")) return null;
  path = path.replace(/^\/+/, "");
  if (path === "") return ["index.html"];
  if (path.endsWith("/")) return [`${path}index.html`];
  return /\.[a-z0-9]+$/i.test(path) ? [path] : [path, `${path}.html`, `${path}/index.html`];
}

const CACHE_MS = 10_000;
const memo = new Map<string, { at: number; value: unknown }>();

async function readJson<T>(env: Env, key: string): Promise<T | null> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T | null;
  const obj = await env.SITES.get(key);
  let value: T | null = null;
  if (obj) {
    try {
      value = JSON.parse(await obj.text()) as T;
    } catch {
      value = null;
    }
  }
  if (memo.size > 5000) memo.clear();
  memo.set(key, { at: Date.now(), value });
  return value;
}

/** Test hook: forget cached pointers. */
export const clearCache = () => memo.clear();

function notFound(env: Env, status = 404) {
  const app = (env.APP_URL ?? "https://gojoline.afridea.et").replace(/\/$/, "").replace(/[<>"&']/g, "");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Not found</title><style>body{font-family:system-ui,"Noto Sans Ethiopic",sans-serif;max-width:32rem;margin:0 auto;padding:3rem 1rem;color:#121212;background:#FBF9F6;line-height:1.6}a{color:#C2370F}</style></head><body><h1>Nothing here yet</h1><p lang="am">እዚህ ምንም ገጽ የለም።</p><p><a href="${app}">Gojoline</a></p></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex" } });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!/^[a-z0-9.-]{1,253}$/.test(host)) return notFound(env);

    const mapping = await readJson<{ site?: string }>(env, `hosts/${host}.json`);
    const slug = mapping?.site;
    if (!slug || !/^[a-z0-9-]{3,40}$/.test(slug)) return notFound(env);
    const pointer = await readJson<Pointer>(env, `sites/${slug}/current.json`);
    if (!pointer || !/^[a-z0-9]{6,40}$/.test(pointer.deployment)) return notFound(env);

    // Same rules as the Vercel fallback: no trailing slash, no .html in addresses.
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) return Response.redirect(`${url.origin}${url.pathname.replace(/\/+$/, "")}${url.search}`, 308);

    const list = candidates(url.pathname);
    if (!list) return notFound(env, 400);
    const root = `sites/${slug}/d/${pointer.deployment}/`;
    let path: string | null = null;
    let obj: R2ObjectLike | null = null;
    for (const c of list) {
      obj = await env.SITES.get(root + c);
      if (obj) {
        path = c;
        break;
      }
    }
    let status = 200;
    if (!obj) {
      obj = await env.SITES.get(`${root}404.html`);
      if (!obj) return notFound(env);
      path = "404.html";
      status = 404;
    }

    const headers = new Headers();
    for (const h of pointer.headers ?? []) {
      if (/^[A-Za-z0-9-]{1,64}$/.test(h.key) && !/[\r\n]/.test(h.value)) headers.set(h.key, h.value);
    }
    headers.set("content-type", contentType(path!));
    headers.set("etag", obj.httpEtag);
    // Hashed build assets never change; pages and other files are checked every time.
    headers.set("cache-control", path!.startsWith("assets/") ? "public, max-age=31536000, immutable" : path!.startsWith("stock/") ? "public, max-age=86400" : "public, max-age=0, must-revalidate");
    if (status === 200 && request.headers.get("if-none-match") === obj.httpEtag) return new Response(null, { status: 304, headers });
    headers.set("content-length", String(obj.size));
    return new Response(request.method === "HEAD" ? null : obj.body, { status, headers });
  },
};

export default worker;

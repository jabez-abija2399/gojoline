/**
 * Serves every published site from R2 (bucket bound as SITES). Deployed by
 * scripts/cloudflare-setup.mjs; no imports, so it uploads as a single module.
 *
 * Layout in the bucket (written by lib/providers/publish/cloudflare.ts):
 *   hosts/<hostname>.json           {"site":"<slug>"}   (<slug>.<base> and connected domains)
 *   sites/<slug>/current.json       {"deployment":"<id>","headers":[{key,value}],"files":[paths]}
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
  /** Linked from the "no site here" page. */
  APP_URL?: string;
  /** Sites' own zone (e.g. afridea.et): <slug>.<BASE_DOMAIN> skips one serial lookup. */
  BASE_DOMAIN?: string;
}
export interface Ctx {
  waitUntil(p: Promise<unknown>): void;
}
interface CacheLike {
  match(key: string): Promise<Response | undefined>;
  put(key: string, res: Response): Promise<void>;
}

interface Pointer {
  deployment: string;
  headers: { key: string; value: string }[];
  /** The deployment's files (older pointers lack it: then paths are probed). */
  files?: string[];
  fileSet?: Set<string>;
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
};

export const contentType = (path: string) => TYPES[/\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase() ?? ""] ?? "application/octet-stream";

/**
 * Where to look for a request path, in order. The template writes pages as <page>/index.html,
 * so that comes first (clean URLs: /about → about/index.html, then about, then about.html).
 */
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
  return /\.[a-z0-9]+$/i.test(path) ? [path] : [`${path}/index.html`, path, `${path}.html`];
}

/** Browser cache lifetime by path. Pages stay short so a new publish or a takedown shows at once. */
export function browserCache(path: string): string {
  if (path.startsWith("assets/")) return "public, max-age=31536000, immutable";
  if (path.startsWith("fonts/") || path.startsWith("stock/")) return "public, max-age=2592000, stale-while-revalidate=604800";
  if (/^favicon\.|^apple-touch-icon|^icon-/.test(path)) return "public, max-age=86400, stale-while-revalidate=604800";
  if (path.startsWith("images/")) return "public, max-age=3600, stale-while-revalidate=86400";
  return "public, max-age=0, must-revalidate";
}

/** If-None-Match against an ETag, ignoring weak markers (Cloudflare weakens ETags when it compresses). */
export function etagMatches(header: string | null, etag: string): boolean {
  if (!header) return false;
  const bare = (t: string) => t.trim().replace(/^W\//, "");
  return header.split(",").some((t) => t.trim() === "*" || bare(t) === bare(etag));
}

const CACHE_MS = 10_000;
const MEMO_MAX = 5000;
const memo = new Map<string, { at: number; value: unknown }>();

async function readJson<T>(env: Env, key: string, prepare?: (v: T) => void): Promise<T | null> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T | null;
  const obj = await env.SITES.get(key);
  let value: T | null = null;
  if (obj) {
    try {
      value = JSON.parse(await obj.text()) as T;
      if (value && prepare) prepare(value);
    } catch {
      value = null;
    }
  }
  memo.delete(key);
  // Drop the oldest entries instead of everything at once.
  while (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value!);
  memo.set(key, { at: Date.now(), value });
  return value;
}

/** Test hook: forget cached pointers. */
export const clearCache = () => memo.clear();

/** Copied from lib/i18n/messages (safety.notFound*, pageMissing*); a test keeps them equal. */
export const TEXT = {
  en: {
    notFoundTitle: "There's no site at this address",
    notFoundBody: "Check the address, or make your own site with Gojoline.",
    notFoundLink: "Make a site with Gojoline",
    pageMissingTitle: "This page doesn't exist",
    pageMissingLink: "Go to the home page",
  },
  am: {
    notFoundTitle: "በዚህ አድራሻ ድረ-ገጽ የለም",
    notFoundBody: "አድራሻውን ያረጋግጡ፣ ወይም በጎጆላይን የራስዎን ድረ-ገጽ ይሥሩ።",
    notFoundLink: "በጎጆላይን ድረ-ገጽ ይሥሩ",
    pageMissingTitle: "ይህ ገጽ የለም",
    pageMissingLink: "ወደ መነሻ ገጹ ይሂዱ",
  },
};

const STYLE = `body{font-family:system-ui,"Noto Sans Ethiopic",sans-serif;max-width:36rem;margin:0 auto;padding:3rem 1rem;color:#121212;background:#FBF9F6;line-height:1.6}h1,h2{font-size:1.5rem;margin:0 0 .5rem}section{margin-bottom:2.5rem}a{color:#C2370F;display:inline-block;min-height:44px;line-height:44px}`;

/** No site at this address ("site"), or a site without its own 404 page ("page"). */
export function notFound(env: Env, kind: "site" | "page" = "site", status = 404) {
  const app = (env.APP_URL ?? "https://gojoline.afridea.et").replace(/\/$/, "").replace(/[<>"&']/g, "");
  const section = (l: "en" | "am") => {
    const t = TEXT[l];
    const h = l === "en" ? "h1" : "h2";
    return kind === "site"
      ? `<${h}>${t.notFoundTitle}</${h}><p>${t.notFoundBody}</p><a href="${app}/${l}">${t.notFoundLink}</a>`
      : `<${h}>${t.pageMissingTitle}</${h}><a href="/">${t.pageMissingLink}</a>`;
  };
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${kind === "site" ? TEXT.en.notFoundTitle : TEXT.en.pageMissingTitle}</title><style>${STYLE}</style></head><body><main><section>${section("en")}</section><section lang="am">${section("am")}</section></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" } });
}

const edgeCache = (): CacheLike | null => (globalThis as unknown as { caches?: { default?: CacheLike } }).caches?.default ?? null;

async function findSite(env: Env, host: string): Promise<{ slug: string; pointer: Pointer } | null> {
  const prepare = (p: Pointer) => {
    if (Array.isArray(p.files)) p.fileSet = new Set(p.files);
  };
  const base = env.BASE_DOMAIN?.toLowerCase();
  const label = base && host.endsWith(`.${base}`) ? host.slice(0, -(base.length + 1)) : "";
  if (/^[a-z0-9-]{3,40}$/.test(label)) {
    // <slug>.<base>: read the mapping and the pointer together (one round trip, not two).
    const [mapping, pointer] = await Promise.all([readJson<{ site?: string }>(env, `hosts/${host}.json`), readJson<Pointer>(env, `sites/${label}/current.json`, prepare)]);
    return mapping?.site === label && pointer ? { slug: label, pointer } : null;
  }
  const slug = (await readJson<{ site?: string }>(env, `hosts/${host}.json`))?.site;
  if (!slug || !/^[a-z0-9-]{3,40}$/.test(slug)) return null;
  const pointer = await readJson<Pointer>(env, `sites/${slug}/current.json`, prepare);
  return pointer ? { slug, pointer } : null;
}

const worker = {
  async fetch(request: Request, env: Env, ctx?: Ctx): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!/^[a-z0-9.-]{1,253}$/.test(host)) return notFound(env);
    // Same rules as the Vercel fallback: no trailing slash, no .html in addresses.
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) return Response.redirect(`${url.origin}${url.pathname.replace(/\/+$/, "")}${url.search}`, 308);

    const site = await findSite(env, host);
    if (!site || !/^[a-z0-9]{6,40}$/.test(site.pointer.deployment)) return notFound(env);
    const { slug, pointer } = site;
    const list = candidates(url.pathname);
    if (!list) return notFound(env, "page", 400);
    const root = `sites/${slug}/d/${pointer.deployment}/`;

    // With the file list the path is known without touching R2; older pointers are probed.
    let path: string | null = null;
    let status = 200;
    if (pointer.fileSet) {
      path = list.find((c) => pointer.fileSet!.has(c)) ?? null;
      if (!path) {
        if (!pointer.fileSet.has("404.html")) return notFound(env, "page");
        path = "404.html";
        status = 404;
      }
    }

    const headers = new Headers();
    for (const h of pointer.headers ?? []) {
      if (/^[A-Za-z0-9-]{1,64}$/.test(h.key) && !/[\r\n]/.test(h.value)) headers.set(h.key, h.value);
    }

    // Edge cache, keyed by deployment: a new publish or a takedown changes the key, so nothing
    // stale is ever served and nothing needs purging.
    const cache = edgeCache();
    const cacheKey = path ? `https://sites-cache.internal/${slug}/${pointer.deployment}/${path}` : null;
    let stored = cache && cacheKey ? await cache.match(cacheKey) : undefined;
    if (!stored) {
      let obj: R2ObjectLike | null = null;
      if (path) obj = await env.SITES.get(root + path);
      else {
        for (const c of list) {
          obj = await env.SITES.get(root + c);
          if (obj) {
            path = c;
            break;
          }
        }
        if (!obj) {
          obj = await env.SITES.get(`${root}404.html`);
          if (!obj) return notFound(env, "page");
          path = "404.html";
          status = 404;
        }
      }
      if (!obj) return notFound(env, "page");
      const h = new Headers({ "content-type": contentType(path!), etag: obj.httpEtag, "content-length": String(obj.size), "cache-control": "public, max-age=31536000" });
      stored = new Response(obj.body, { status, headers: h });
      if (cache && cacheKey) {
        const copy = stored.clone();
        const put = cache.put(cacheKey, copy).catch(() => undefined);
        if (ctx) ctx.waitUntil(put);
      }
    }

    for (const k of ["content-type", "etag", "content-length"]) {
      const v = stored.headers.get(k);
      if (v) headers.set(k, v);
    }
    headers.set("cache-control", browserCache(path!));
    const etag = headers.get("etag") ?? "";
    if (status === 200 && etagMatches(request.headers.get("if-none-match"), etag)) {
      headers.delete("content-length");
      return new Response(null, { status: 304, headers });
    }
    return new Response(request.method === "HEAD" ? null : stored.body, { status, headers });
  },
};

export default worker;

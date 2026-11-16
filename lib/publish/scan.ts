/**
 * Checks a built site before it goes public. Generated sites must be static pages with our
 * own bundled script only: no inline or third-party scripts, frames, plugin objects,
 * javascript: links, redirects, forms posting elsewhere or password fields.
 */
export interface ScanIssue {
  file: string;
  rule: string;
  detail: string;
}

export interface ScanOptions {
  /** Origins forms may post to (the Gojoline Data API). */
  allowedFormOrigins?: string[];
}

const MAX_FILE_BYTES = 2_000_000;
const MAX_TOTAL_BYTES = 15_000_000;
/**
 * The only files a published site may contain. Anything else (api/, vercel.json, middleware,
 * config or data files) could turn into server code or routing rules on the host.
 */
const ALLOWED_PATHS = [
  /^(?:[a-z0-9-]+\/)*index\.html$/,
  /^assets\/[\w.-]+\.(?:js|css)$/,
  /^fonts\/[\w.-]+\.woff2$/,
  /^images\/[\w.-]+\.(?:webp|png|jpe?g|avif)$/,
  // Sample photos from the template's own library.
  /^stock\/[a-z0-9-]+\.webp$/,
  /^favicon\.svg$/,
  /^sitemap\.xml$/,
  /^robots\.txt$/,
];

function snippet(text: string, index: number) {
  return text.slice(Math.max(0, index - 20), index + 60).replace(/\s+/g, " ");
}

function scanHtml(file: string, html: string, opts: ScanOptions, issues: ScanIssue[]) {
  const add = (rule: string, index: number) => issues.push({ file, rule, detail: snippet(html, index) });
  for (const m of html.matchAll(/<script\b([^>]*)>/gi)) {
    const attrs = m[1] ?? "";
    const src = /\bsrc\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1];
    // Structured data blocks are not executed (and CSP blocks inline scripts anyway).
    if (!src && /\btype\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
    // The page's own content for hydration: a data block, never executed.
    if (!src && /\btype\s*=\s*["']application\/json["']/i.test(attrs) && /\bid\s*=\s*["']site-data["']/i.test(attrs)) continue;
    if (!src) add("inline-script", m.index!);
    else if (!/^\/assets\/[\w.-]+\.js$/.test(src)) add("external-script", m.index!);
  }
  for (const tag of ["iframe", "frame", "object", "embed", "applet", "base"]) {
    for (const m of html.matchAll(new RegExp(`<${tag}\\b`, "gi"))) add(`${tag}-tag`, m.index!);
  }
  for (const m of html.matchAll(/\b(?:href|src|action|formaction)\s*=\s*["']\s*(?:javascript|vbscript|data:text\/html)/gi)) add("script-url", m.index!);
  for (const m of html.matchAll(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh/gi)) add("meta-refresh", m.index!);
  for (const m of html.matchAll(/\son[a-z]+\s*=\s*["']/gi)) add("inline-handler", m.index!);
  for (const m of html.matchAll(/<input\b[^>]*type\s*=\s*["']?password/gi)) add("password-field", m.index!);
  for (const m of html.matchAll(/<form\b([^>]*)>/gi)) {
    const action = /\baction\s*=\s*["']([^"']*)["']/i.exec(m[1] ?? "")?.[1];
    if (action && !action.startsWith("/") && !(opts.allowedFormOrigins ?? []).some((o) => action.startsWith(o))) add("external-form", m.index!);
  }
}

function scanJs(file: string, js: string, issues: ScanIssue[]) {
  // The bundle is our template plus agent-written sections; catch the obvious abuse patterns.
  const rules: [string, RegExp][] = [
    ["password-field", /type\s*:\s*["']password["']/],
    ["eval", /\beval\s*\(|new\s+Function\s*\(/],
    ["remote-script", /createElement\(\s*["']script["']\s*\)/],
    // Assignments only (React itself compares `location.href == ...`).
    ["redirect", /\blocation\s*(?:\.\s*href)?\s*=(?!=)|\blocation\.(?:assign|replace)\(|\bwindow\.open\(/],
  ];
  for (const [rule, re] of rules) {
    const m = re.exec(js);
    if (m) issues.push({ file, rule, detail: snippet(js, m.index) });
  }
}

export function scanBuiltSite(files: { path: string; data: Buffer }[], opts: ScanOptions = {}): ScanIssue[] {
  const issues: ScanIssue[] = [];
  let total = 0;
  if (!files.some((f) => f.path === "index.html")) issues.push({ file: "index.html", rule: "missing-index", detail: "" });
  for (const f of files) {
    total += f.data.length;
    if (f.path.includes("..") || f.path.startsWith("/")) issues.push({ file: f.path, rule: "bad-path", detail: "" });
    if (!ALLOWED_PATHS.some((re) => re.test(f.path))) issues.push({ file: f.path, rule: "file-type", detail: "" });
    if (f.data.length > MAX_FILE_BYTES) issues.push({ file: f.path, rule: "file-too-large", detail: String(f.data.length) });
    if (f.path.endsWith(".html")) scanHtml(f.path, f.data.toString("utf8"), opts, issues);
    else if (f.path.endsWith(".js")) scanJs(f.path, f.data.toString("utf8"), issues);
    else if (f.path.endsWith(".svg") && /<script\b|\son[a-z]+\s*=|javascript:/i.test(f.data.toString("utf8"))) {
      issues.push({ file: f.path, rule: "svg-script", detail: "" });
    }
  }
  if (total > MAX_TOTAL_BYTES) issues.push({ file: "*", rule: "site-too-large", detail: String(total) });
  return issues;
}

/** Security headers for every published site (served by the host from vercel.json). */
export function publishedSiteHeaders(opts: { dataApiOrigin?: string } = {}) {
  const api = opts.dataApiOrigin ? ` ${opts.dataApiOrigin}` : "";
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // No outside images: they could carry typed-in data away (an image URL is a request).
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${api}`,
    `form-action 'self'${api}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000" },
  ];
}

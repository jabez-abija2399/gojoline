/**
 * The "Made with Gojoline" badge on Free sites links back to Gojoline itself (never a domain we
 * don't own), tagged so sign-ups from it are counted: ?ref=site_<slug> plus utm tags.
 *
 * It is not part of the site's React app: publish adds it to every built page, after the app,
 * as a <gojoline-badge> element whose look lives in a declarative shadow root (the site's CSS
 * can't reach inside) and whose own box is pinned with inline `!important` declarations (which
 * beat any stylesheet rule, `!important` included). The site's styles may not name it at all.
 */
export const BADGE_UTM = { utm_source: "gojoline_badge", utm_medium: "referral", utm_campaign: "made_with" } as const;
export const BADGE_TAG = "gojoline-badge";

/** The badge's link for a page in `lang`. */
export function badgeHref(appUrl: string, slug: string, lang: "en" | "am"): string {
  const params = new URLSearchParams({ ref: `site_${slug}`, ...BADGE_UTM });
  return `${new URL(appUrl).origin}/${lang}?${params.toString()}`;
}

const TEXT = { en: "Made with Gojoline", am: "በጎጆላይን የተሠራ" } as const;

/** Every property that could hide or shrink the host box, pinned. */
const HOST_STYLE = [
  "display:block",
  "position:static",
  "visibility:visible",
  "opacity:1",
  "transform:none",
  "translate:none",
  "scale:none",
  "rotate:none",
  "filter:none",
  "clip-path:none",
  "mask:none",
  "-webkit-mask:none",
  "mix-blend-mode:normal",
  "width:auto",
  "height:auto",
  "min-height:0",
  "max-height:none",
  "max-width:none",
  "overflow:visible",
  "margin:0",
  "padding:0",
  "border:0",
  "float:none",
  "zoom:1",
  "contain:none",
  "content-visibility:visible",
  "pointer-events:auto",
  "isolation:isolate",
  "z-index:2147483647",
]
  .map((d) => `${d}!important`)
  .join(";");

/** Inside the shadow root: fixed colours and sizes (a site's custom properties don't apply). */
const SHADOW_CSS =
  ".b{all:initial;display:flex;justify-content:center;padding:16px 16px 20px;background:#f7f4ef}" +
  "a{all:initial;box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border:1px solid #d9d2c7;border-radius:999px;background:#fff;color:#121212;font:500 14px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans Ethiopic',sans-serif;text-decoration:none;cursor:pointer}" +
  "a:hover{background:#f1ede6}a:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}" +
  "svg{width:14px;height:14px;flex:none}" +
  // Phones: room for the site's fixed call bar at the bottom.
  "@media (max-width:767px){.b{padding-bottom:88px}}";

const ICON = '<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2.5 7.5 8 3l5.5 4.5V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5Z"/></svg>';

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function badgeMarkup(href: string, lang: "en" | "am"): string {
  return `<${BADGE_TAG} style="${HOST_STYLE}"><template shadowrootmode="open"><style>${SHADOW_CSS}</style><div class="b"><a href="${escapeAttr(href)}" lang="${lang}">${ICON}${TEXT[lang]}</a></div></template></${BADGE_TAG}>`;
}

/** The page's language from <html lang>. */
const pageLang = (html: string): "en" | "am" => (/<html[^>]*\blang="am"/i.test(html) ? "am" : "en");

/** Adds the badge to every built page, just before </body>. */
export function addBadge(files: { path: string; data: Buffer }[], appUrl: string, slug: string): { path: string; data: Buffer }[] {
  return files.map((f) => {
    if (!f.path.endsWith("index.html") && f.path !== "404.html") return f;
    const html = f.data.toString("utf8");
    const at = html.lastIndexOf("</body>");
    if (at === -1) return f;
    const lang = pageLang(html);
    return { path: f.path, data: Buffer.from(html.slice(0, at) + badgeMarkup(badgeHref(appUrl, slug, lang), lang) + html.slice(at)) };
  });
}

/** The site's own styles may not target the badge (it stays visible on Free plans). */
export function badgeIssues(styles: string | undefined): { file: string; rule: string; detail: string }[] {
  return styles && /gojoline-badge/i.test(styles) ? [{ file: "src/styles.css", rule: "badge-hidden", detail: "Styles may not change the Made with Gojoline badge" }] : [];
}

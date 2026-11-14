import { renderToString } from "react-dom/server";
import { App, findPage } from "./App";
import { localePath, parsePath, t } from "./lib/i18n";
import { styleString, themeVariables } from "./lib/theme";
import type { Lang } from "./lib/types";
import { publishMeta } from "./lib/meta";
import { site } from "./site";

export interface RenderedPage {
  url: string;
  lang: Lang;
  html: string;
  head: string;
  htmlAttrs: { lang: string; style: string };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Every URL the site serves: each page in each language. */
export function routes(): string[] {
  return site.pages.flatMap((p) => site.languages.map((l) => localePath(p.path, l, site)));
}

export function render(url: string): RenderedPage | null {
  const { lang, path } = parsePath(url, site);
  const page = findPage(site, path);
  if (!page) return null;
  const html = renderToString(<App site={site} page={page} lang={lang} />);
  const title = page.path === "/" ? t(site.name, lang, site) : `${t(page.title, lang, site)} · ${t(site.name, lang, site)}`;
  const description = t(page.description ?? site.tagline, lang, site);
  const base = siteUrl();
  const alternates = site.languages
    .map((l) => (base ? `<link rel="alternate" hreflang="${l}" href="${base}${localePath(page.path, l, site)}">` : ""))
    .join("");
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    description ? `<meta name="description" content="${escapeHtml(description)}">` : "",
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    description ? `<meta property="og:description" content="${escapeHtml(description)}">` : "",
    `<meta property="og:type" content="website">`,
    base ? `<link rel="canonical" href="${base}${localePath(page.path, lang, site)}">` : "",
    alternates,
    `<meta name="theme-color" content="${escapeHtml(site.theme.primary)}">`,
    lang === "am" ? `<link rel="preload" href="/fonts/noto-sans-ethiopic-core.woff2" as="font" type="font/woff2" crossorigin>` : "",
  ]
    .filter(Boolean)
    .join("\n    ");
  return {
    url,
    lang,
    html,
    head,
    htmlAttrs: { lang, style: styleString(themeVariables(site.theme, lang)) },
  };
}

/** Public URL of the published site (set at publish time), if any. */
export function siteUrl(): string | undefined {
  return publishMeta.url ?? site.meta?.url?.replace(/\/$/, "");
}

export { site };

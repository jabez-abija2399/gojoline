import { renderToString } from "react-dom/server";
import { App, findPage } from "./App";
import { localePath, parsePath, t } from "./lib/i18n";
import { headingFontFile, styleString, themeVariables } from "./lib/theme";
import type { Lang, Site } from "./lib/types";
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
    page.path === "/" ? `<script type="application/ld+json">${jsonLd(lang, base)}</script>` : "",
    // The page's own content for the browser to pick up (hydration): the script bundle no
    // longer carries the whole site. Not executed; "<" is escaped so it can't close the tag.
    `<script type="application/json" id="site-data">${JSON.stringify(pageData(page.path)).replace(/</g, "\\u003c")}</script>`,
    // One font preload per page: Ge'ez for Amharic, the heading font otherwise.
    lang === "am"
      ? `<link rel="preload" href="/fonts/noto-sans-ethiopic-core.woff2" as="font" type="font/woff2" crossorigin>`
      : `<link rel="preload" href="/fonts/${headingFontFile[site.theme.font]}" as="font" type="font/woff2" crossorigin>`,
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

/** schema.org LocalBusiness data for search engines (only facts the owner gave). */
function jsonLd(lang: Lang, base: string | undefined): string {
  const b = site.business;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: t(site.name, lang, site),
    ...(site.tagline ? { description: t(site.tagline, lang, site) } : {}),
    ...(base ? { url: base } : {}),
    ...(b.phone ? { telephone: b.phone } : {}),
    ...(b.email ? { email: b.email } : {}),
    ...(b.address ? { address: t(b.address, lang, site) } : {}),
  };
  // Escape "<" so the JSON can never close the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * The site with only this page's sections: other pages keep their path, title and menu label,
 * and the home page its opening hero (the header shows its main button on every page).
 */
export function pageData(path: string): Site {
  return {
    ...site,
    pages: site.pages.map((p) => {
      if (p.path === path) return p;
      const hero = p.path === "/" && p.sections[0]?.type === "hero" ? [p.sections[0]] : [];
      return { path: p.path, title: p.title, nav: p.nav, sections: hero };
    }),
  };
}

/** Public URL of the published site (set at publish time), if any. */
export function siteUrl(): string | undefined {
  return publishMeta.url ?? site.meta?.url?.replace(/\/$/, "");
}

export { site };

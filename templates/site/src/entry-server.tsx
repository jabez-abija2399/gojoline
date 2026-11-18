import { renderToString } from "react-dom/server";
import { App, findPage } from "./App";
import { localePath, parsePath, t } from "./lib/i18n";
import { headingFontFile, styleString, themeVariables } from "./lib/theme";
import type { Lang, Page, Site } from "./lib/types";
import { publishMeta, seoMeta } from "./lib/meta";
import { withBase } from "./lib/base";
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
  const seo = seoMeta();
  // The owner's Google title and description (dashboard) lead on the home page; other pages keep theirs.
  const home = page.path === "/";
  const title = (home && t(seo.title, lang, site)) || (home ? t(site.name, lang, site) : `${t(page.title, lang, site)} · ${t(site.name, lang, site)}`);
  const description = (home && t(seo.description, lang, site)) || t(page.description ?? site.tagline, lang, site);
  const base = siteUrl();
  // The owner's share picture, else this page's (or the home page's) hero photo: what Telegram shows.
  const picture = shareImage(page, lang, seo.image);
  const image = picture && base ? `${base}${withBase(picture.src)}` : "";
  const canonical = base ? `${base}${localePath(page.path, lang, site)}` : "";
  const alternates = site.languages
    .map((l) => (base ? `<link rel="alternate" hreflang="${l}" href="${base}${localePath(page.path, l, site)}">` : ""))
    .join("");
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    description ? `<meta name="description" content="${escapeHtml(description)}">` : "",
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    description ? `<meta property="og:description" content="${escapeHtml(description)}">` : "",
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(t(site.name, lang, site))}">`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}">`,
    ...site.languages.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`),
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}">` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : "",
    image && picture?.alt ? `<meta property="og:image:alt" content="${escapeHtml(picture.alt)}">` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    description ? `<meta name="twitter:description" content="${escapeHtml(description)}">` : "",
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : "",
    seo.icon ? `<link rel="icon" href="${escapeHtml(withBase(seo.icon))}">` : "",
    canonical ? `<link rel="canonical" href="${canonical}">` : "",
    alternates,
    `<meta name="theme-color" content="${escapeHtml(site.theme.primary)}">`,
    page.path === "/" ? `<script type="application/ld+json">${jsonLd(lang, base)}</script>` : "",
    // The page's own content for the browser to pick up (hydration): the script bundle no
    // longer carries the whole site. Not executed; "<" is escaped so it can't close the tag.
    `<script type="application/json" id="site-data">${JSON.stringify(pageData(page.path, lang)).replace(/</g, "\\u003c")}</script>`,
    // One font preload per page: Ge'ez for Amharic, the heading font otherwise.
    lang === "am"
      ? `<link rel="preload" href="${withBase("/fonts/noto-sans-ethiopic-core.woff2")}" as="font" type="font/woff2" crossorigin>`
      : `<link rel="preload" href="${withBase(`/fonts/${headingFontFile[site.theme.font]}`)}" as="font" type="font/woff2" crossorigin>`,
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

const OG_LOCALE: Record<Lang, string> = { en: "en_US", am: "am_ET" };

/** A photo for link previews: the owner's choice, else the first hero photo of this page or the home page. */
export function shareImage(page: Page, lang: Lang, chosen?: string): { src: string; alt: string } | null {
  if (chosen) return { src: chosen, alt: "" };
  const home = site.pages.find((p) => p.path === "/");
  for (const p of [page, home]) {
    const hero = p?.sections.find((s) => s.type === "hero");
    const img = hero?.type === "hero" ? hero.image : undefined;
    if (img?.src && /^\/(images|stock)\/[\w.-]+$/.test(img.src)) return { src: img.src, alt: t(img.alt, lang, site) };
  }
  return null;
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
export function pageData(path: string, lang?: Lang): Site {
  const data: Site = {
    ...site,
    pages: site.pages.map((p) => {
      if (p.path === path) return p;
      const hero = p.path === "/" && p.sections[0]?.type === "hero" ? [p.sections[0]] : [];
      return { path: p.path, title: p.title, nav: p.nav, sections: hero };
    }),
  };
  return lang ? (onlyLanguage(data, lang) as Site) : data;
}

/** Keeps one language of every text ({ en, am } → { am }): a page only shows its own language. */
function onlyLanguage(value: unknown, lang: Lang): unknown {
  if (Array.isArray(value)) return value.map((v) => onlyLanguage(v, lang));
  if (!value || typeof value !== "object") return value;
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length > 0 && keys.every((k) => k === "en" || k === "am") && keys.every((k) => typeof o[k] === "string")) {
    return o[lang] !== undefined ? { [lang]: o[lang] } : o;
  }
  return Object.fromEntries(keys.map((k) => [k, k === "languages" ? o[k] : onlyLanguage(o[k], lang)]));
}

/** Public URL of the published site (set at publish time), if any. */
export function siteUrl(): string | undefined {
  return publishMeta.url ?? site.meta?.url?.replace(/\/$/, "");
}

export { site };

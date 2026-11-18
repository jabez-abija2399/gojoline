/**
 * Values Gojoline sets at publish time through build environment variables.
 * Locked: the agent can't change these.
 */
const env = import.meta.env;

export const publishMeta = {
  url: (env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || undefined,
  siteId: (env.VITE_SITE_ID as string | undefined) || undefined,
  // Relative fallback (template demos are served from Gojoline itself); publish always sets the full URL.
  reportUrl: (env.VITE_REPORT_URL as string | undefined) || "/report",
  dataApiUrl: (env.VITE_DATA_API_URL as string | undefined) || undefined,
  siteKey: (env.VITE_SITE_KEY as string | undefined) || undefined,
  /** From the owner's plan at publish time; nothing in site.json can switch it off. */
  badge: env.VITE_BADGE !== "0",
  /** Gojoline's own address with "{lang}" for the page's language, plus ?ref=site_<slug> and utm tags. */
  badgeUrl: (env.VITE_BADGE_URL as string | undefined) || "/{lang}",
  /** The host answers with its own resting page when the owner takes the site offline (Cloudflare). */
  restAtHost: env.VITE_REST_AT_HOST === "1",
};

/** The owner's Google and share preview (dashboard → Settings), set at publish time. */
export interface SeoMeta {
  title?: { en?: string; am?: string };
  description?: { en?: string; am?: string };
  /** "/images/<name>" (one of the site's own photos). */
  image?: string;
  icon?: string;
}

export function seoMeta(raw: string | undefined = env.VITE_SEO as string | undefined): SeoMeta {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as SeoMeta;
    const photo = (p?: string) => (typeof p === "string" && /^\/images\/[\w.-]+$/.test(p) ? p : undefined);
    return { title: v.title, description: v.description, image: photo(v.image), icon: photo(v.icon) };
  } catch {
    return {};
  }
}

/** The "Made with Gojoline" link for a page in `lang` (the URL's "{lang}" becomes en or am). */
export function badgeHref(lang: "en" | "am", template: string = publishMeta.badgeUrl): string {
  return template.replace("{lang}", lang);
}

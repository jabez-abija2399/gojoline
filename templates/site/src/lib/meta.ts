/**
 * Values Gojoline sets at publish time through build environment variables.
 * Locked: the agent can't change these.
 */
const env = import.meta.env;

export const publishMeta = {
  url: (env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || undefined,
  siteId: (env.VITE_SITE_ID as string | undefined) || undefined,
  reportUrl: (env.VITE_REPORT_URL as string | undefined) || "https://gojoline.com/report",
  dataApiUrl: (env.VITE_DATA_API_URL as string | undefined) || undefined,
  siteKey: (env.VITE_SITE_KEY as string | undefined) || undefined,
  badge: env.VITE_BADGE !== "0",
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

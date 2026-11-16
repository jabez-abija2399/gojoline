import { z } from "zod";

/**
 * How the site looks in Google results and in shared links (Telegram, Facebook, WhatsApp).
 * Crawlers don't run scripts, so these go into the pages at the next publish (VITE_SEO).
 */
const text = (max: number) => z.string().trim().max(max);
const bilingual = (max: number) => z.object({ en: text(max).optional(), am: text(max).optional() }).strict();
/** One of the owner's own photos (see AssetStore), by its stored name. */
const photo = z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}\.(?:webp|png|jpe?g|avif)$/);

export const seoSettings = z
  .object({
    title: bilingual(70).optional(),
    description: bilingual(160).optional(),
    image: photo.nullable().optional(),
    /** Shown in the browser tab instead of the default icon. */
    icon: photo.nullable().optional(),
  })
  .strict();

export type SeoSettings = z.infer<typeof seoSettings>;

/** The build variable the site template reads (src/entry-server.tsx); undefined when nothing is set. */
export function seoEnv(seo: SeoSettings | null, photos: string[]): string | undefined {
  if (!seo) return undefined;
  const pick = (t?: { en?: string; am?: string }) => {
    const out: Record<string, string> = {};
    if (t?.en) out.en = t.en;
    if (t?.am) out.am = t.am;
    return Object.keys(out).length ? out : undefined;
  };
  // A photo the owner has since removed is skipped (the site keeps its default).
  const has = (name?: string | null) => (name && photos.includes(name) ? `/images/${name}` : undefined);
  const data = { title: pick(seo.title), description: pick(seo.description), image: has(seo.image), icon: has(seo.icon) };
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  return Object.keys(clean).length ? JSON.stringify(clean) : undefined;
}

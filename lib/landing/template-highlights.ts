import "server-only";
import { presetSiteJson, type PresetId } from "@/lib/template/presets";
import { TEMPLATE_INFO, type HighlightKey } from "./template-info";

interface Section {
  type: string;
  kind?: string;
  layout?: string;
  items?: unknown[];
}
interface SiteShape {
  languages?: string[];
  business?: { phone?: string; telegram?: string; whatsapp?: string; hours?: unknown[] };
  pages: { sections: Section[] }[];
}

const priced = (s: Section) => (s.items ?? []).some((i) => typeof i === "object" && i !== null && "price" in i && Boolean((i as { price?: unknown }).price));

/** Every highlight the template's own content backs up (sections, contact details, languages). */
export function supportedHighlights(site: SiteShape): Set<HighlightKey> {
  const all = site.pages.flatMap((p) => p.sections);
  const has = (f: (s: Section) => boolean) => all.some(f);
  const form = (kind: string) => has((s) => s.type === "form" && s.kind === kind);
  const b = site.business ?? {};
  const langs = site.languages ?? [];
  const checks: Record<HighlightKey, boolean> = {
    menu: has((s) => s.type === "menu"),
    prices: has((s) => s.type === "menu" || priced(s)),
    booking: form("booking"),
    order: form("order"),
    registration: form("registration"),
    contactForm: form("contact"),
    gallery: has((s) => s.type === "gallery"),
    team: has((s) => s.type === "cards" && s.layout === "people"),
    cards: has((s) => s.type === "cards" && s.layout !== "people"),
    times: has((s) => s.type === "schedule"),
    // Opening hours show in every page's footer (and the contact section).
    hours: (b.hours?.length ?? 0) > 0,
    reviews: has((s) => s.type === "testimonials"),
    faq: has((s) => s.type === "faq"),
    map: has((s) => s.type === "map"),
    // The phone bar at the bottom of the site and the contact section.
    callTelegram: Boolean(b.phone && b.telegram),
    whatsapp: Boolean(b.whatsapp),
    numbers: has((s) => s.type === "stats"),
    steps: has((s) => s.type === "steps"),
    timeline: has((s) => s.type === "timeline"),
    languages: langs.includes("en") && langs.includes("am"),
  };
  return new Set((Object.keys(checks) as HighlightKey[]).filter((k) => checks[k]));
}

export interface Highlight {
  key: HighlightKey;
  /** Template-specific wording, or null for the standard label in lib/i18n. */
  label: string | null;
}

/** The template's chosen highlights in the visitor's language, keeping only what the template really has. */
export function templateHighlights(id: PresetId, locale: "en" | "am"): Highlight[] {
  const supported = supportedHighlights(JSON.parse(presetSiteJson(id)) as SiteShape);
  return TEMPLATE_INFO[id].highlights.flatMap((pick) => {
    const key = typeof pick === "string" ? pick : pick.key;
    if (!supported.has(key)) return [];
    return [{ key, label: typeof pick === "string" ? null : pick.label[locale] }];
  });
}

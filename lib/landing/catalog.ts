import "server-only";
import { PRESET_IDS, presetSiteJson, type PresetId } from "@/lib/template/presets";
import sections from "./template-sections.json";
import { TEMPLATE_INFO, type TemplateCategory } from "./template-info";

/** What a template's pages include, read from its sections (filters on the templates page). */
export const TEMPLATE_FEATURES = ["prices", "booking", "gallery", "team", "times", "reviews", "map"] as const;
export type TemplateFeature = (typeof TEMPLATE_FEATURES)[number];
export const TEMPLATE_STYLES = ["editorial", "bold", "clean", "warm", "luxe", "swiss", "bento", "organic", "cinematic", "brutal", "calm", "kinetic", "grand", "avant", "precise", "monochrome", "drafting", "noir"] as const;
export type TemplateStyle = (typeof TEMPLATE_STYLES)[number];

export interface CatalogItem {
  id: PresetId;
  category: TemplateCategory;
  style: TemplateStyle;
  features: TemplateFeature[];
  /** The sample business: its name and line, searched as well. */
  name: string;
  tagline: string;
  pages: number;
  /** The top of the home page at computer width (640×400). */
  card: string;
}

type Text = { en?: string; am?: string };
interface Section {
  type: string;
  layout?: string;
  kind?: string;
  price?: unknown;
  items?: { price?: unknown }[];
}

function featuresOf(all: Section[]): TemplateFeature[] {
  const has = (f: (s: Section) => boolean) => all.some(f);
  const out: TemplateFeature[] = [];
  if (has((s) => s.type === "menu" || (s.items ?? []).some((i) => i.price))) out.push("prices");
  if (has((s) => s.type === "form" && (s.kind === "booking" || s.kind === "registration" || s.kind === "order"))) out.push("booking");
  if (has((s) => s.type === "gallery")) out.push("gallery");
  if (has((s) => s.type === "cards" && s.layout === "people")) out.push("team");
  if (has((s) => s.type === "schedule")) out.push("times");
  if (has((s) => s.type === "testimonials")) out.push("reviews");
  if (has((s) => s.type === "map")) out.push("map");
  return out;
}

/** Every template with what the templates page shows and filters by, in the visitor's language. */
export function templateCatalog(locale: "en" | "am"): CatalogItem[] {
  const pick = (t: Text | undefined) => t?.[locale] ?? t?.en ?? "";
  const shots = sections as Record<string, Partial<Record<"en" | "am", unknown>>>;
  return PRESET_IDS.flatMap((id) => {
    const lang = shots[id]?.[locale] ? locale : shots[id]?.en ? "en" : null;
    if (!lang) return [];
    const site = JSON.parse(presetSiteJson(id)) as { name: Text; tagline?: Text; theme: { style?: TemplateStyle }; pages: { sections: Section[] }[] };
    return [
      {
        id,
        category: TEMPLATE_INFO[id].category,
        style: site.theme.style ?? "warm",
        features: featuresOf(site.pages.flatMap((p) => p.sections)),
        name: pick(site.name),
        tagline: pick(site.tagline),
        pages: site.pages.length,
        card: `/templates/${id}/${lang}-card.webp`,
      },
    ];
  });
}

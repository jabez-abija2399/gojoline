import "server-only";
import { PRESET_IDS, isPresetId, presetSiteJson, type PresetId } from "@/lib/template/presets";

type Text = { en?: string; am?: string };

export interface PreviewPage {
  title: string;
  /** Where this page of the live demo is, in the visitor's language ("/demo/hotel/am/rooms"). */
  src: string;
}

export interface TemplatePreview {
  id: PresetId;
  name: string;
  tagline: string;
  pages: PreviewPage[];
  sectionCount: number;
  prev: PresetId;
  next: PresetId;
}

/** Everything the preview page shows for one template: its pages as addresses of the live demo. */
export function templatePreview(id: string, locale: "en" | "am"): TemplatePreview | null {
  if (!isPresetId(id)) return null;
  const pick = (t: Text | undefined) => t?.[locale] ?? t?.en ?? "";
  const site = JSON.parse(presetSiteJson(id)) as { name: Text; tagline?: Text; languages: ("en" | "am")[]; pages: { path: string; title: Text; nav?: Text; sections: unknown[] }[] };
  // The demo's first language has no prefix; the other is under /<lang>.
  const lang = site.languages.includes(locale) ? locale : site.languages[0]!;
  const prefix = lang === site.languages[0] ? "" : `/${lang}`;
  const pages = site.pages.map((p) => ({ title: pick(p.nav ?? p.title), src: `/demo/${id}${prefix}${p.path === "/" ? "" : p.path}` || `/demo/${id}` }));
  const at = PRESET_IDS.indexOf(id);
  return {
    id,
    name: pick(site.name),
    tagline: pick(site.tagline),
    pages,
    sectionCount: site.pages.reduce((n, p) => n + p.sections.length, 0),
    prev: PRESET_IDS[(at - 1 + PRESET_IDS.length) % PRESET_IDS.length]!,
    next: PRESET_IDS[(at + 1) % PRESET_IDS.length]!,
  };
}

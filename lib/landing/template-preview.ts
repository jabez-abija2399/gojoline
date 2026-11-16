import "server-only";
import { PRESET_IDS, isPresetId, presetSiteJson, type PresetId } from "@/lib/template/presets";

type Text = { en?: string; am?: string };
interface RawSection {
  type: string;
  heading?: Text;
  quote?: Text;
  items?: { title?: Text; name?: Text | string; question?: Text; time?: Text; value?: Text; label?: Text }[];
  categories?: { name?: Text; items?: unknown[] }[];
  images?: unknown[];
  fields?: { label?: Text }[];
}

/** One section of a template page: what it is and its title (the live demo shows it). */
export interface PreviewPart {
  /** Section type ("hero", "cards"…), or "footer". */
  kind: string;
  /** The section's own title in the visitor's language, if it has one. */
  heading: string;
  /** What the section lists, in words, for people who can't see the picture. */
  summary: string;
}

export interface PreviewPage {
  title: string;
  /** Where the page lives on the site ("/", "/menu"). */
  path: string;
  /** The live demo of this page in the visitor's language ("/demo/hotel/am/rooms"). */
  src: string;
  parts: PreviewPart[];
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

/** Everything the preview page shows for one template: its pages, their sections, and where the live demo is. */
export function templatePreview(id: string, locale: "en" | "am"): TemplatePreview | null {
  if (!isPresetId(id)) return null;
  const pick = (t: Text | undefined) => t?.[locale] ?? t?.en ?? "";
  const site = JSON.parse(presetSiteJson(id)) as { name: Text; tagline?: Text; languages: ("en" | "am")[]; pages: { path: string; title: Text; nav?: Text; sections: RawSection[] }[] };
  // The demo's first language has no prefix; the other is under /<lang> (scripts/template-demos.mjs).
  const lang = site.languages.includes(locale) ? locale : site.languages[0]!;
  const prefix = lang === site.languages[0] ? "" : `/${lang}`;
  const pages = site.pages.map((p) => {
    const parts = [...p.sections, null].map((s) => {
      const title = s ? pick(s.heading) || pick(s.quote) : "";
      return { kind: s?.type ?? "footer", heading: title.length > 90 ? `${title.slice(0, 88).trimEnd()}…` : title, summary: s ? summarize(s, pick) : "" };
    });
    return { title: pick(p.nav ?? p.title), path: p.path, src: `/demo/${id}${prefix}${p.path === "/" ? "" : p.path}`, parts };
  });
  const at = PRESET_IDS.indexOf(id);
  return {
    id,
    name: pick(site.name),
    tagline: pick(site.tagline),
    pages,
    sectionCount: pages.reduce((n, p) => n + p.parts.filter((x) => x.kind !== "footer").length, 0),
    prev: PRESET_IDS[(at - 1 + PRESET_IDS.length) % PRESET_IDS.length]!,
    next: PRESET_IDS[(at + 1) % PRESET_IDS.length]!,
  };
}

/** The names a section lists (cards, services, questions, times, menu categories, form fields), comma separated. */
function summarize(s: RawSection, pick: (t: Text | undefined) => string): string {
  const names = (s.items ?? []).map((i) => {
    const label = typeof i.name === "string" ? i.name : pick(i.title ?? i.question ?? (i.name as Text | undefined));
    if (i.time) return `${pick(i.title)} ${pick(i.time)}`;
    if (i.value) return `${pick(i.value)} ${pick(i.label)}`;
    return label;
  });
  const list = [...names, ...(s.categories ?? []).map((c) => pick(c.name)), ...(s.fields ?? []).map((f) => pick(f.label))].filter(Boolean);
  return list.slice(0, 12).join(", ");
}

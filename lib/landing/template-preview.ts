import "server-only";
import { PRESET_IDS, isPresetId, presetSiteJson, type PresetId } from "@/lib/template/presets";
import sections from "./template-sections.json";

type Text = { en?: string; am?: string };
type Size = { src: string; width: number; height: number };
type Shots = Record<string, Partial<Record<"en" | "am", { path: string; parts: { d: Size; m: Size }[] }[]>>>;
interface RawSection {
  type: string;
  heading?: Text;
  quote?: Text;
  items?: { title?: Text; name?: Text | string; question?: Text; time?: Text; value?: Text; label?: Text }[];
  categories?: { name?: Text; items?: unknown[] }[];
  images?: unknown[];
  fields?: { label?: Text }[];
}

/** One section of a template page: what it is, its title, and its picture at both widths. */
export interface PreviewPart {
  /** Section type ("hero", "cards"…), or "footer". */
  kind: string;
  /** The section's own title in the visitor's language, if it has one. */
  heading: string;
  /** What the section lists, in words, for people who can't see the picture. */
  summary: string;
  d: Size;
  m: Size;
}

export interface PreviewPage {
  title: string;
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

/** Everything the preview page shows for one template, or null when there are no pictures for it. */
export function templatePreview(id: string, locale: "en" | "am"): TemplatePreview | null {
  if (!isPresetId(id)) return null;
  const shots = (sections as Shots)[id]?.[locale] ?? (sections as Shots)[id]?.en;
  if (!shots) return null;
  const pick = (t: Text | undefined) => t?.[locale] ?? t?.en ?? "";
  const site = JSON.parse(presetSiteJson(id)) as { name: Text; tagline?: Text; pages: { path: string; title: Text; nav?: Text; sections: RawSection[] }[] };
  const pages = site.pages.flatMap((p) => {
    const shot = shots.find((s) => s.path === p.path);
    if (!shot) return [];
    const parts = shot.parts.map((sizes, i) => {
      const s = p.sections[i];
      const title = s ? pick(s.heading) || pick(s.quote) : "";
      return { kind: s?.type ?? "footer", heading: title.length > 90 ? `${title.slice(0, 88).trimEnd()}…` : title, summary: s ? summarize(s, pick) : "", ...sizes };
    });
    return [{ title: pick(p.nav ?? p.title), parts }];
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

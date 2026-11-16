import "server-only";
import data from "./hero-sections.json";

type Size = { src: string; width: number; height: number };
type Sections = Record<string, Partial<Record<"en" | "am", { d: Size; m: Size }[]>>>;

/**
 * The first sections of the five hero templates, at computer (d) and phone (m) width: what the
 * landing page's live build puts together. Pictures of the real sites, kept in public/hero/.
 */
export function firstSections(id: string, locale: "en" | "am"): { d: Size; m: Size }[] {
  const all = data as Sections;
  return all[id]?.[locale] ?? all[id]?.en ?? [];
}

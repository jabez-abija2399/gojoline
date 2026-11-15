import "server-only";
import { presetSiteJson, type PresetId } from "@/lib/template/presets";
import { readableOn } from "@/templates/site/src/lib/color";

export const SHOWCASE = ["cafe", "hotel", "clinic", "shop", "personal"] as const satisfies readonly PresetId[];
export type ShowcaseId = (typeof SHOWCASE)[number];

/** What the hero demo shows for one business: taken from the real starter template. */
export interface ShowcaseSite {
  id: ShowcaseId;
  name: string;
  tagline: string;
  primary: string;
  accent: string;
  background: string;
  text: string;
  /** Readable text colours on the primary and accent fills (as the real template picks them). */
  onPrimary: string;
  onAccent: string;
  items: { name: string; price: string }[];
}

type Text = { en?: string; am?: string };
interface PresetLike {
  name: Text;
  tagline?: Text;
  theme: { primary: string; accent: string; background: string; text: string };
  pages: { sections: { type: string; categories?: { items: { name: Text; price?: { amountMinor: number } }[] }[]; items?: { title: Text; price?: { amountMinor: number } }[] }[] }[];
}

export function showcaseSites(locale: "en" | "am"): ShowcaseSite[] {
  const pick = (t: Text | undefined) => t?.[locale] ?? t?.en ?? "";
  const birr = (minor: number) => `${new Intl.NumberFormat("en-US").format(minor / 100)} ${locale === "am" ? "ብር" : "Birr"}`;
  return SHOWCASE.map((id) => {
    const site = JSON.parse(presetSiteJson(id)) as PresetLike;
    const items: { name: string; price: string }[] = [];
    for (const page of site.pages)
      for (const s of page.sections) {
        for (const c of s.categories ?? []) for (const it of c.items) if (it.price) items.push({ name: pick(it.name), price: birr(it.price.amountMinor) });
        for (const it of s.items ?? []) if (it.price) items.push({ name: pick(it.title), price: birr(it.price.amountMinor) });
      }
    // Sites without prices (a personal site) show what the owner offers instead.
    if (items.length === 0)
      for (const page of site.pages) for (const s of page.sections) if (s.type === "services") for (const it of s.items ?? []) items.push({ name: pick(it.title), price: "" });
    const { primary, accent, background, text } = site.theme;
    return { id, name: pick(site.name), tagline: pick(site.tagline), primary, accent, background, text, onPrimary: readableOn(primary), onAccent: readableOn(accent), items: items.slice(0, 3) };
  });
}

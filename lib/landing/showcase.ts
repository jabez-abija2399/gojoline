import "server-only";
import { PRESET_IDS, presetSiteJson, type PresetId } from "@/lib/template/presets";
import shots from "./showcase-shots.json";

/** The five kinds of business the hero offers as a starting description. */
export const HERO_IDS = ["cafe", "hotel", "clinic", "shop", "personal"] as const satisfies readonly PresetId[];
export type HeroId = (typeof HERO_IDS)[number];

/** One real Gojoline site (a starter template) and the picture of its home page. */
export interface ShowcaseSite {
  id: PresetId;
  name: string;
  tagline: string;
  /** Whole home page at phone width; made by scripts/showcase-shots.mjs. */
  shot: { src: string; width: number; height: number };
  /** Just the top of the page, small: what a gallery card shows. */
  top: { src: string; width: number; height: number };
  /** The top of the same site in Gojoline's own colours (the landing page's showcase). */
  brand?: { src: string; width: number; height: number };
}

type Text = { en?: string; am?: string };
type Size = { src: string; width: number; height: number };
type Shot = Size & { top: Size; brand?: Size };

export function showcaseSites(locale: "en" | "am"): ShowcaseSite[] {
  const pick = (t: Text | undefined) => t?.[locale] ?? t?.en ?? "";
  const all = shots as Record<string, Partial<Record<"en" | "am", Shot>>>;
  return PRESET_IDS.flatMap((id) => {
    const shot = all[id]?.[locale] ?? all[id]?.en;
    if (!shot) return [];
    const site = JSON.parse(presetSiteJson(id)) as { name: Text; tagline?: Text };
    return [{ id, name: pick(site.name), tagline: pick(site.tagline), shot: { src: shot.src, width: shot.width, height: shot.height }, top: shot.top, brand: shot.brand }];
  });
}

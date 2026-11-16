import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TEMPLATE_ROOT } from "./files";

/** Ready-made starting sites, one per industry (templates/site/presets/<id>.json, EN + AM). */
export const PRESET_IDS = ["cafe", "hotel", "clinic", "school", "shop", "worship", "mosque", "events", "ngo", "real-estate", "tours", "personal", "business", "salon"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export function isPresetId(v: unknown): v is PresetId {
  return typeof v === "string" && (PRESET_IDS as readonly string[]).includes(v);
}

const cache = new Map<PresetId, string>();

/** The preset's site.json text (validated by the template schema in tests). */
export function presetSiteJson(id: PresetId): string {
  let json = cache.get(id);
  if (!json) {
    json = readFileSync(join(TEMPLATE_ROOT, "presets", `${id}.json`), "utf8");
    cache.set(id, json);
  }
  return json;
}

let styles: string | null = null;

/** Files for a project's first version when it starts from a preset. */
export function presetVersionFiles(id: PresetId): Record<string, string> {
  styles ??= readFileSync(join(TEMPLATE_ROOT, "src", "styles.css"), "utf8");
  return { "src/site.json": presetSiteJson(id), "src/styles.css": styles };
}

/** The business name in the owner's language, used as the project's first name. */
export function presetName(id: PresetId, locale: "en" | "am"): string {
  const name = (JSON.parse(presetSiteJson(id)) as { name: { en?: string; am?: string } }).name;
  return name[locale] ?? name.en ?? "";
}

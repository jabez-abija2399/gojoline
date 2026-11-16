import { describe, expect, it } from "vitest";
import { siteSchema, themeWarnings } from "@/templates/site/src/lib/schema";
import { extractForms } from "@/lib/cloud/forms";
import { PRESET_IDS, presetName, presetSiteJson, presetVersionFiles } from "./presets";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { isVersionedPath, stockFilesFor, TEMPLATE_ROOT, templateFiles } from "./files";

describe("industry presets", () => {
  it.each(PRESET_IDS)("%s is a valid bilingual site with readable colours and a form", (id) => {
    const site = siteSchema.parse(JSON.parse(presetSiteJson(id)));
    expect(site.languages).toEqual(["en", "am"]);
    expect(themeWarnings(site.theme)).toEqual([]);
    const missing: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (!v || typeof v !== "object") return;
      const o = v as Record<string, unknown>;
      if (("en" in o || "am" in o) && !(o.en && o.am)) missing.push(path);
      for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
    };
    walk(site, id);
    expect(missing).toEqual([]);
    expect(extractForms(presetSiteJson(id)).length).toBeGreaterThan(0);
    expect(presetName(id, "am")).toMatch(/[ሀ-፿]/);
    expect(Object.keys(presetVersionFiles(id)).every(isVersionedPath)).toBe(true);
  });

  it.each(PRESET_IDS)("%s uses real photos from the library, none twice on a page", (id) => {
    const json = presetSiteJson(id);
    const site = JSON.parse(json) as { pages: { path: string; sections: unknown[] }[] };
    const refs = [...json.matchAll(/"src": "([^"]+)"/g)].map((m) => m[1]!);
    expect(refs.length).toBeGreaterThanOrEqual(6);
    for (const src of refs) {
      expect(src).toMatch(/^\/stock\/[a-z0-9-]+\.webp$/);
      expect(existsSync(join(TEMPLATE_ROOT, "public", src)), src).toBe(true);
    }
    for (const page of site.pages) {
      const onPage = [...JSON.stringify(page).matchAll(/"src":"([^"]+)"/g)].map((m) => m[1]!);
      expect(onPage.filter((s, i) => onPage.indexOf(s) !== i), `${id} ${page.path}`).toEqual([]);
    }
  });

  it("a sandbox gets only the photos its site uses, with the wide version of hero photos", () => {
    const files = stockFilesFor('{"a":"/stock/hotel-hero-lodge-pool-dusk.webp","b":"/stock/hotel-card-standard-room.webp","c":"/stock/../../etc/passwd.webp","d":"/stock/nope.webp"}');
    expect(files.map((f) => f.path)).toEqual(["public/stock/hotel-card-standard-room.webp", "public/stock/hotel-hero-lodge-pool-dusk.webp", "public/stock/hotel-hero-lodge-pool-dusk-1600.webp"]);
    expect(templateFiles().some((f) => f.path.startsWith("public/stock/"))).toBe(false);
  });

  it("presets are not copied into every sandbox build", () => {
    expect(templateFiles().some((f) => f.path.startsWith("presets/"))).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { siteSchema, themeWarnings } from "@/templates/site/src/lib/schema";
import { extractForms } from "@/lib/cloud/forms";
import { PRESET_IDS, presetName, presetSiteJson, presetVersionFiles } from "./presets";
import { isVersionedPath, templateFiles } from "./files";

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

  it("presets are not copied into every sandbox build", () => {
    expect(templateFiles().some((f) => f.path.startsWith("presets/"))).toBe(false);
  });
});

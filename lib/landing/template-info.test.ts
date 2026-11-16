import { describe, expect, it } from "vitest";
import { PRESET_IDS, presetSiteJson } from "@/lib/template/presets";
import { en } from "@/lib/i18n/messages/en";
import { am } from "@/lib/i18n/messages/am";
import { HIGHLIGHT_KEYS, TEMPLATE_CATEGORIES, TEMPLATE_INFO, isTemplateCategory } from "./template-info";
import { supportedHighlights, templateHighlights } from "./template-highlights";

const ETHIOPIC = /[ሀ-፿]/;

describe("template info", () => {
  it.each(PRESET_IDS)("%s says who it suits in both languages", (id) => {
    const { designedFor } = TEMPLATE_INFO[id];
    expect(designedFor.en.length).toBeGreaterThanOrEqual(3);
    expect(designedFor.en.length).toBeLessThanOrEqual(6);
    // Same list in both languages, item by item.
    expect(designedFor.am).toHaveLength(designedFor.en.length);
    for (const item of designedFor.am) expect(item).toMatch(ETHIOPIC);
    for (const item of designedFor.en) expect(item).not.toMatch(ETHIOPIC);
  });

  it.each(PRESET_IDS)("%s shows 4 to 7 highlights, every one backed by its sections", (id) => {
    const supported = supportedHighlights(JSON.parse(presetSiteJson(id)));
    const picked = TEMPLATE_INFO[id].highlights.map((h) => (typeof h === "string" ? h : h.key));
    expect(picked.filter((k) => !supported.has(k))).toEqual([]);
    expect(new Set(picked).size).toBe(picked.length);
    for (const locale of ["en", "am"] as const) {
      const shown = templateHighlights(id, locale);
      expect(shown.length).toBeGreaterThanOrEqual(4);
      expect(shown.length).toBeLessThanOrEqual(7);
    }
    for (const h of TEMPLATE_INFO[id].highlights) if (typeof h !== "string") expect(h.label.am).toMatch(ETHIOPIC);
  });

  it("never claims what a template lacks", () => {
    const site = { languages: ["en"], business: { phone: "+251 911 000 000" }, pages: [{ sections: [{ type: "hero" }, { type: "form", kind: "contact" }] }] };
    const s = supportedHighlights(site);
    expect([...s].sort()).toEqual(["contactForm"]);
    expect(s.has("callTelegram")).toBe(false);
    expect(s.has("languages")).toBe(false);
  });

  it("has a category for every template, with labels and every category in use", () => {
    const used = new Set(PRESET_IDS.map((id) => TEMPLATE_INFO[id].category));
    expect([...used].sort()).toEqual([...TEMPLATE_CATEGORIES].sort());
    for (const c of TEMPLATE_CATEGORIES) {
      expect(en.landing.gallery.categories[c]).toBeTruthy();
      expect(am.landing.gallery.categories[c]).toMatch(ETHIOPIC);
    }
    expect(isTemplateCategory("food")).toBe(true);
    expect(isTemplateCategory("hospitality")).toBe(false);
    expect(isTemplateCategory(undefined)).toBe(false);
  });

  it("has a standard label for every highlight in both languages", () => {
    for (const k of HIGHLIGHT_KEYS) {
      expect(en.landing.templatePreview.highlights[k]).toBeTruthy();
      expect(am.landing.templatePreview.highlights[k]).toMatch(ETHIOPIC);
    }
  });
});

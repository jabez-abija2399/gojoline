import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { siteSchema } from "@/templates/site/src/lib/schema";
import { PRESET_IDS, presetSiteJson } from "@/lib/template/presets";
import { readLists } from "./lists";

const starter = readFileSync("templates/site/src/site.json", "utf8");

describe("lists", () => {
  it("finds the starter menu categories with prices", () => {
    const r = readLists(starter)!;
    expect(r.languages).toEqual(["en", "am"]);
    expect(r.lists.map((l) => l.kind)).toEqual(["menu", "menu"]);
    expect(r.lists[0]!.items[1]).toEqual({ ref: 1, name: { en: "Macchiato", am: "ማኪያቶ" }, description: {}, priceMinor: 5000 });
  });
});

describe("lists read every menu and services section the template builds (no schema drift)", () => {
  it.each(PRESET_IDS)("%s preset", (id) => {
    const json = presetSiteJson(id);
    const site = siteSchema.parse(JSON.parse(json));
    const sections = site.pages.flatMap((p) => p.sections);
    const expected = sections.flatMap((s) => (s.type === "menu" ? s.categories.map(() => "menu") : s.type === "services" ? ["services"] : []));
    expect(readLists(json)!.lists.map((l) => l.kind)).toEqual(expected);
  });
  it("keeps reading a menu with every optional property set", () => {
    const item = { name: { en: "Tea" }, description: { en: "Hot" }, price: { amountMinor: 3000, currency: "ETB" }, tag: { en: "New" }, image: { art: "coffee", alt: { en: "Tea" } }, unit: { en: "cup" } };
    const menu = { type: "menu", id: "menu", eyebrow: { en: "Drinks" }, heading: { en: "Menu" }, intro: { en: "Fresh" }, layout: "table", tone: "dark", categories: [{ name: { en: "Hot" }, items: [item] }] };
    const r = readLists(JSON.stringify({ languages: ["en"], pages: [{ sections: [menu] }] }))!;
    expect(r.lists[0]!.items[0]).toEqual({ ref: 0, name: { en: "Tea" }, description: { en: "Hot" }, priceMinor: 3000 });
  });
});

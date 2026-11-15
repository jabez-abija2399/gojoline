import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applyListEdit, readLists } from "./lists";

const starter = readFileSync("templates/site/src/site.json", "utf8");

describe("lists", () => {
  it("finds the starter menu categories with prices", () => {
    const r = readLists(starter)!;
    expect(r.languages).toEqual(["en", "am"]);
    expect(r.lists.map((l) => l.kind)).toEqual(["menu", "menu"]);
    expect(r.lists[0]!.items[1]).toEqual({ ref: 1, name: { en: "Macchiato", am: "ማኪያቶ" }, description: {}, priceMinor: 5000 });
  });

  it("edits prices, removes and adds items, keeping other fields", () => {
    const list = readLists(starter)!.lists[0]!;
    const items = list.items.map((i) => ({ ...i }));
    items[1]!.priceMinor = 6000;
    items.splice(0, 1);
    items.push({ ref: null, name: { en: "Tea", am: "ሻይ" }, description: {}, priceMinor: 2500 });
    const r = applyListEdit(starter, { key: list.key, items });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const again = readLists(r.json)!.lists[0]!.items;
    expect(again.map((i) => [i.name.en, i.priceMinor])).toEqual([["Macchiato", 6000], ["Full coffee ceremony", 25000], ["Tea", 2500]]);
    const saved = JSON.parse(r.json).pages[1].sections[0].categories[0].items;
    expect(saved[0].tag).toEqual({ en: "Popular", am: "ተወዳጅ" }); // Macchiato keeps its tag
    expect(saved[2]).toEqual({ name: { en: "Tea", am: "ሻይ" }, price: { amountMinor: 2500, currency: "ETB" } });
  });

  it("refuses unnamed items and wrong pointers", () => {
    expect(applyListEdit(starter, { key: "p1.s0.c0", items: [{ ref: null, name: {}, description: {}, priceMinor: 1 }] })).toEqual({ ok: false, error: "name_required" });
    expect(applyListEdit(starter, { key: "p9.s0.c0", items: [] })).toEqual({ ok: false, error: "not_found" });
    expect(applyListEdit(starter, { key: "p0.s0", items: [] })).toEqual({ ok: false, error: "not_found" });
  });
});

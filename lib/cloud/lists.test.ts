import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
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

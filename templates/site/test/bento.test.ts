import { describe, expect, it } from "vitest";
import { featureClass } from "../src/sections/Services";

// Rows must be full: the feature tile plus the rest fill whole rows at 2 and 3 columns.
function cells(count: number, cols: 2 | 3): number {
  const cls = featureClass(count);
  const span = cols === 3 ? (cls.includes("lg:col-span-3") ? 3 : cls.includes("lg:col-span-2") ? 2 : 1) * (cls.includes("lg:row-span-2") ? 2 : 1) : cls.includes("sm:col-span-2") ? 2 : 1;
  return span + count - 1;
}

describe("services bento", () => {
  it("plain grid below 4 items", () => expect(featureClass(3)).toBe(""));
  for (const n of [4, 5, 6, 7, 8, 9]) {
    it(`${n} items leave no holes`, () => {
      expect(cells(n, 3) % 3).toBe(0);
      expect(cells(n, 2) % 2).toBe(0);
    });
  }
});

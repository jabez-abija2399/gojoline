import { describe, expect, it } from "vitest";
import { safeNext } from "./next";

describe("safeNext", () => {
  it("keeps same-site paths and a product choice", () => {
    expect(safeNext("en", "/en/billing")).toBe("/en/billing");
    expect(safeNext("am", "/am/billing?product=business_year")).toBe("/am/billing?product=business_year");
  });
  it("refuses other sites, other queries and odd paths", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/en//evil.example", "/en/billing?next=https://x", "/en/billing?product=A%20B", "/fr/billing", "/en/billing?product=x#y"]) {
      expect(safeNext("en", bad)).toBe("/en/build");
    }
  });
});

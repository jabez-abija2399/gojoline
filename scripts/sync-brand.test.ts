import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRAND_COPIES } from "./sync-brand.mjs";

describe("brand assets", () => {
  it("served copies match brand/ (run `npm run brand:sync` if this fails)", () => {
    for (const [from, to] of BRAND_COPIES as [string, string][]) {
      expect(readFileSync(to).equals(readFileSync(from)), to).toBe(true);
    }
  });
});

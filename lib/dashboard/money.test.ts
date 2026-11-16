import { describe, expect, it } from "vitest";
import { formatBirr, parseBirr } from "./money";

describe("Birr", () => {
  it("formats minor units like the site", () => {
    expect(formatBirr(4000, "{amount} Birr")).toBe("40 Birr");
    expect(formatBirr(4550, "{amount} ብር")).toBe("45.50 ብር");
    expect(formatBirr(125_000, "{amount} Birr")).toBe("1,250 Birr");
  });
  it("reads what the owner typed as integer minor units", () => {
    expect(parseBirr("45.5")).toBe(4550);
    expect(parseBirr("0.1")).toBe(10);
    expect(parseBirr("19.99")).toBe(1999);
    expect(parseBirr("")).toBeNull();
    expect(parseBirr("4,5")).toBeNull();
    expect(parseBirr(".5")).toBe(50);
    expect(parseBirr(".")).toBeNull();
  });
});

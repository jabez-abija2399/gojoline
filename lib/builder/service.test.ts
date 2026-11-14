import { describe, expect, it } from "vitest";
import { siteName } from "./service";

describe("siteName", () => {
  const ts = `export const site: Site = {\n  name: { en: "Selam Coffee", am: "ሰላም ቡና" },\n  tagline: { en: "x" },`;
  it("prefers the project language", () => {
    expect(siteName(ts, "en")).toBe("Selam Coffee");
    expect(siteName(ts, "am")).toBe("ሰላም ቡና");
  });
  it("falls back to the other language, or null", () => {
    expect(siteName(`name: { am: "ጀበና" },`, "en")).toBe("ጀበና");
    expect(siteName("nothing here", "en")).toBeNull();
  });
});

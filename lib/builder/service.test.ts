import { describe, expect, it } from "vitest";
import { siteName } from "./service";

describe("siteName", () => {
  const ts = JSON.stringify({ name: { en: "Selam Coffee", am: "ሰላም ቡና" }, tagline: { en: "x" } });
  it("prefers the project language", () => {
    expect(siteName(ts, "en")).toBe("Selam Coffee");
    expect(siteName(ts, "am")).toBe("ሰላም ቡና");
  });
  it("falls back to the other language, or null", () => {
    expect(siteName(JSON.stringify({ name: { am: "ጀበና" } }), "en")).toBe("ጀበና");
    expect(siteName("not json", "en")).toBeNull();
  });
});

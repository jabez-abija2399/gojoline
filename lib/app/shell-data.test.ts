import { describe, expect, it } from "vitest";

import { ago, greetingName, liveAddress } from "./shell-data";

describe("greetingName", () => {
  it("uses the first name only", () => {
    expect(greetingName("Hana Bekele")).toBe("Hana");
    expect(greetingName("  ሐና በቀለ ")).toBe("ሐና");
  });
  it("never greets by a phone number or an email", () => {
    expect(greetingName("+251911000000")).toBeNull();
    expect(greetingName("0911000000")).toBeNull();
    expect(greetingName("owner@example.com")).toBeNull();
    expect(greetingName("")).toBeNull();
  });
});

describe("liveAddress", () => {
  const base = { slug: "selam", url: "https://selam.gojoline.site", customDomain: null };
  it("is only given for a published site", () => {
    expect(liveAddress(null)).toBeNull();
    expect(liveAddress({ ...base, status: "pending" })).toBeNull();
    expect(liveAddress({ ...base, status: "taken_down" })).toBeNull();
    expect(liveAddress({ ...base, status: "published" })).toEqual({ href: "https://selam.gojoline.site", text: "selam.gojoline.site" });
  });
  it("prefers the owner's own address once it works", () => {
    expect(liveAddress({ ...base, status: "published", customDomain: "selamcoffee.com" })?.text).toBe("selam.gojoline.site");
    expect(liveAddress({ ...base, status: "published", customDomain: "selamcoffee.com", customDomainVerifiedAt: new Date() })?.text).toBe("selamcoffee.com");
  });
  it("only ever links to https", () => {
    expect(liveAddress({ ...base, status: "published", url: "http://selam.example" })).toBeNull();
  });
});

describe("ago", () => {
  const now = Date.UTC(2026, 10, 16, 12);
  const back = (ms: number) => new Date(now - ms);
  it("words the time since the last change", () => {
    expect(ago(back(5_000), "en", now)).toBe("1 minute ago");
    expect(ago(back(3 * 3_600_000), "en", now)).toBe("3 hours ago");
    expect(ago(back(26 * 3_600_000), "en", now)).toBe("yesterday");
    expect(ago(back(70 * 86_400_000), "en", now)).toBe("2 months ago");
  });
  it("speaks Amharic", () => {
    expect(ago(back(3 * 3_600_000), "am", now)).toMatch(/[ሀ-፿]/);
  });
});

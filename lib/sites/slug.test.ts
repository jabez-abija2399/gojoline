import { describe, expect, it } from "vitest";
import { checkSlug, suggestSlug } from "./slug";

describe("slugs", () => {
  it.each(["selam-coffee", "abc", "bole2"])("accepts %s", (s) => expect(checkSlug(s)).toBeNull());
  it.each(["ab", "-abc", "abc-", "ABC", "a b", "sélam", "a--b", "x".repeat(41)])("rejects format %s", (s) => expect(checkSlug(s)).toBe("format"));
  it.each(["admin", "telebirr", "bank", "telebirr-support", "cbe"])("rejects reserved %s", (s) => expect(checkSlug(s)).toBe("reserved"));
  it("suggests from names", () => {
    expect(suggestSlug("Selam Coffee & Tea!", "site-1")).toBe("selam-coffee-and-tea");
    expect(suggestSlug("Café Lalibela", "site-1")).toBe("cafe-lalibela");
    expect(suggestSlug("ጀበና ካፌ", "site-1")).toBe("site-1");
  });
});

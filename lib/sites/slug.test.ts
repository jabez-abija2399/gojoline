import { describe, expect, it } from "vitest";
import { EXAMPLE_SLUG, checkSlug, suggestSlug } from "./slug";

describe("slugs", () => {
  it.each(["selam-coffee", "abc", "bole2"])("accepts %s", (s) => expect(checkSlug(s)).toBeNull());
  it.each(["ab", "-abc", "abc-", "ABC", "a b", "sélam", "a--b", "x".repeat(41)])("rejects format %s", (s) => expect(checkSlug(s)).toBe("format"));
  it.each(["admin", "telebirr", "bank", "telebirr-support", "cbe", "mytelebirr", "cbe-login", "secure-pay", "dashenbank-online"])("rejects reserved %s", (s) => expect(checkSlug(s)).toBe("reserved"));
  it("keeps the landing page's example address for nobody", () => expect(checkSlug(EXAMPLE_SLUG)).toBe("reserved"));
  it.each(["preview", "autoconfig", "autodiscover", "smtp", "imap", "pop", "pop3", "mx", "webmail", "ns", "ns1", "ns2", "mail", "email", "cpanel", "ftp", "admin", "app", "api", "www", "gojoline", "status", "docs", "help", "static", "cdn", "assets", "sites"])(
    "keeps the host name %s (sites live at <slug>.afridea.et)",
    (s) => expect(checkSlug(s)).not.toBeNull(), // "mx", "ns": too short anyway
  );
  it("refuses _dmarc by format and leaves longer names with those words free", () => {
    expect(checkSlug("_dmarc")).toBe("format");
    expect(checkSlug("pop-art-gallery")).toBeNull();
    expect(checkSlug("ftp-tours")).toBeNull();
  });
  it("suggests from names", () => {
    expect(suggestSlug("Selam Coffee & Tea!", "site-1")).toBe("selam-coffee-and-tea");
    expect(suggestSlug("Café Lalibela", "site-1")).toBe("cafe-lalibela");
    expect(suggestSlug("ጀበና ካፌ", "site-1")).toBe("site-1");
  });
});

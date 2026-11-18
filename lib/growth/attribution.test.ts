import { describe, expect, it } from "vitest";
import { attributionFromRequest, classifySource, cookieValue, decodeAttribution, encodeAttribution, referralCodeOf, type Attribution } from "./attribution";

const from = (query: string, referrer: string | null = null) => attributionFromRequest(new URLSearchParams(query), referrer, "gojoline.afridea.et", 1000);

describe("attributionFromRequest", () => {
  it("reads ref and utm tags, cleaned and lower case", () => {
    expect(from("ref=site_Bole-Bakery&utm_source=gojoline_badge&utm_medium=referral&utm_campaign=made_with")).toEqual({ r: "site_bole-bakery", s: "gojoline_badge", m: "referral", c: "made_with", t: 1000 });
    expect(from("utm_source=<script>tik tok")).toEqual({ s: "scripttiktok", t: 1000 });
  });
  it("uses the referring host only without tags, and never our own host", () => {
    expect(from("", "https://t.me/gojoline")).toEqual({ h: "t.me", t: 1000 });
    expect(from("", "https://gojoline.afridea.et/en/pricing")).toBeNull();
    expect(from("", null)).toBeNull();
    expect(from("", "https://accounts.google.com/o/oauth2")).toBeNull();
    expect(from("", "not a url")).toBeNull();
    expect(from("ref=", null)).toBeNull();
  });
});

describe("cookie", () => {
  it("round-trips and rejects anything else", () => {
    const a: Attribution = { r: "u_abc12345", s: "telegram", t: 5 };
    expect(decodeAttribution(encodeAttribution(a))).toEqual(a);
    expect(decodeAttribution("%7B%22x%22%3A1%7D")).toBeNull();
    expect(decodeAttribution("%%%")).toBeNull();
    expect(decodeAttribution(undefined)).toBeNull();
    expect(decodeAttribution("x".repeat(700))).toBeNull();
    expect(cookieValue("a=1; gojo_src=abc; b=2", "gojo_src")).toBe("abc");
    expect(cookieValue("gojo_srcx=1", "gojo_src")).toBeUndefined();
  });
});

describe("classifySource", () => {
  const c = (a: Omit<Attribution, "t"> | null) => classifySource(a ? { ...a, t: 0 } : null);
  it("sorts first touches into the overview's buckets", () => {
    expect(c(null)).toBe("direct");
    expect(c({ r: "site_bole" })).toBe("badge");
    expect(c({ s: "gojoline_badge" })).toBe("badge");
    expect(c({ r: "u_abc12345" })).toBe("referral");
    expect(c({ r: "qr" })).toBe("qr");
    expect(c({ s: "flyer", m: "qr" })).toBe("qr");
    expect(c({ s: "telegram" })).toBe("telegram");
    expect(c({ h: "t.me" })).toBe("telegram");
    expect(c({ s: "tiktok" })).toBe("tiktok");
    expect(c({ h: "www.tiktok.com" })).toBe("tiktok");
    expect(c({ s: "fb" })).toBe("facebook");
    expect(c({ h: "l.facebook.com" })).toBe("facebook");
    expect(c({ s: "linkedin" })).toBe("linkedin");
    expect(c({ h: "lnkd.in" })).toBe("linkedin");
    expect(c({ h: "www.google.com" })).toBe("other");
    expect(c({ c: "launch" })).toBe("other");
  });
  it("finds the referral code", () => {
    expect(referralCodeOf({ r: "u_abc12345", t: 0 })).toBe("abc12345");
    expect(referralCodeOf({ r: "u_a", t: 0 })).toBeNull();
    expect(referralCodeOf({ r: "site_x", t: 0 })).toBeNull();
    expect(referralCodeOf(null)).toBeNull();
  });
});

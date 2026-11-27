import { describe, expect, it } from "vitest";
import { attributionFromRequest, classifySource } from "./attribution";
import { isShortCode, SHORT_CODES, shortTarget, shortUrl } from "./short-links";

describe("short links", () => {
  it("each code leads home with its utm tags, and the visit is attributed to its network", () => {
    const want: Record<string, string> = { tg: "telegram", tgg: "telegram", ig: "instagram", tt: "tiktok", fb: "facebook", yt: "youtube" };
    for (const code of SHORT_CODES) {
      const target = new URL(shortTarget(code), "https://gojoline.afridea.et");
      expect(target.pathname).toBe("/");
      const a = attributionFromRequest(target.searchParams, null, "gojoline.afridea.et");
      expect(classifySource(a)).toBe(want[code]);
      expect(a?.c).toBe(`link-${code}`);
    }
    expect(shortUrl("https://gojoline.afridea.et/", "tg")).toBe("https://gojoline.afridea.et/r/tg");
  });

  it("only known codes are short links", () => {
    expect(isShortCode("ig")).toBe(true);
    expect(isShortCode("toString")).toBe(false);
    expect(isShortCode("../admin")).toBe(false);
  });

  it("Instagram, YouTube and Google visits get their own source", () => {
    const from = (referrer: string) => classifySource(attributionFromRequest(new URLSearchParams(), referrer, "gojoline.afridea.et"));
    expect(from("https://l.instagram.com/")).toBe("instagram");
    expect(from("https://www.youtube.com/")).toBe("youtube");
    expect(from("https://www.google.com/")).toBe("google");
    expect(from("https://www.google.com.et/")).toBe("google");
    expect(from("https://t.me/gojoline")).toBe("telegram");
  });
});

import { describe, expect, it } from "vitest";
import { render, routes } from "../src/entry-server";
import { contrast, readableOn } from "../src/lib/color";
import { formatPrice, localePath, parsePath } from "../src/lib/i18n";
import { siteSchema, themeWarnings } from "../src/lib/schema";
import { site } from "../src/site";

const langs = { languages: ["en", "am"] as ("en" | "am")[] };

describe("routing", () => {
  it("default language has no prefix, second language does", () => {
    expect(localePath("/", "en", langs)).toBe("/");
    expect(localePath("/menu", "am", langs)).toBe("/am/menu");
    expect(parsePath("/am/menu/", langs)).toEqual({ lang: "am", path: "/menu" });
    expect(parsePath("/menu/index.html", langs)).toEqual({ lang: "en", path: "/menu" });
    expect(parsePath("/am", langs)).toEqual({ lang: "am", path: "/" });
  });
  it("lists every page in every language", () => {
    expect(routes()).toEqual(["/", "/am", "/menu", "/am/menu"]);
  });
});

describe("render", () => {
  it("renders Amharic with lang, theme variables, title and one h1", () => {
    const page = render("/am/")!;
    expect(page.lang).toBe("am");
    expect(page.htmlAttrs.style).toContain("--site-primary:#8A4B24");
    expect(page.head).toContain("<title>ቦሌ ቡና ቤት</title>");
    expect(page.head).toContain("noto-sans-ethiopic-core.woff2");
    expect(page.html.match(/<h1/g)).toHaveLength(1);
    expect(page.html).toContain("በየማለዳው የሚቆላ ቡና");
  });
  it("returns null for unknown pages", () => {
    expect(render("/nope")).toBeNull();
  });
  it("escapes text in the head", () => {
    const original = site.name.en;
    site.name.en = '</title><script>alert(1)</script>';
    try {
      expect(render("/")!.head).not.toContain("<script>");
    } finally {
      site.name.en = original;
    }
  });
});

describe("schema", () => {
  it("accepts the starter site with no contrast warnings", () => {
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(themeWarnings(site.theme)).toEqual([]);
  });
  it("rejects javascript: links, unknown sections and missing home page", () => {
    const bad = structuredClone(site) as unknown as { pages: { path: string; sections: unknown[] }[] };
    bad.pages[0]!.sections.push({ type: "hero", heading: { en: "x" }, primaryAction: { label: { en: "x" }, href: "javascript:alert(1)" } });
    expect(siteSchema.safeParse(bad).success).toBe(false);
    const bad2 = structuredClone(site) as unknown as { pages: { path: string; sections: unknown[] }[] };
    bad2.pages[0]!.sections.push({ type: "marquee" });
    expect(siteSchema.safeParse(bad2).success).toBe(false);
    const bad3 = structuredClone(site);
    bad3.pages = bad3.pages.filter((p) => p.path !== "/");
    expect(siteSchema.safeParse(bad3).success).toBe(false);
  });
  it("flags low-contrast themes", () => {
    expect(themeWarnings({ ...site.theme, text: "#bbbbbb" }).length).toBeGreaterThan(0);
  });
});

describe("helpers", () => {
  it("formats Birr from minor units without floats leaking", () => {
    expect(formatPrice({ amountMinor: 4000, currency: "ETB" }, "en")).toBe("40 Birr");
    expect(formatPrice({ amountMinor: 4050, currency: "ETB" }, "am")).toBe("40.50 ብር");
    expect(formatPrice({ amountMinor: 123456789, currency: "ETB" }, "en")).toBe("1,234,567.89 Birr");
  });
  it("picks readable text colours", () => {
    expect(readableOn("#8A4B24")).toBe("#ffffff");
    expect(readableOn("#FDE68A")).toBe("#1c1917");
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21);
  });
});

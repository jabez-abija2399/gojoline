import { describe, expect, it } from "vitest";
import { PRESET_IDS } from "@/lib/template/presets";
import { isSector, SECTOR_PAGES, SECTORS } from "./sectors";
import { sectorJsonLd } from "./sector-jsonld";
import sitemap from "@/app/sitemap";

const ethiopic = /[ሀ-፿]/;

describe("sector pages", () => {
  it("cover the twelve sectors, each mapped to a real template", () => {
    expect(SECTORS).toEqual(["cafe", "restaurant", "church", "mosque", "school", "salon", "shop", "hotel", "clinic", "wedding", "ngo", "portfolio"]);
    for (const s of SECTORS) expect(PRESET_IDS).toContain(SECTOR_PAGES[s].template);
    expect(isSector("church")).toBe(true);
    expect(isSector("casino")).toBe(false);
  });

  it("are specific per sector, never thin duplicates, in both languages", () => {
    for (const lang of ["en", "am"] as const) {
      const all = SECTORS.map((s) => SECTOR_PAGES[s].copy[lang]);
      const unique = (xs: string[]) => expect(new Set(xs).size).toBe(xs.length);
      unique(all.map((c) => c.headline));
      unique(all.map((c) => c.intro));
      unique(all.flatMap((c) => c.benefits.map((b) => b.body)));
      unique(all.flatMap((c) => c.faq.map((f) => f.q)));
      for (const c of all) {
        expect(c.benefits).toHaveLength(3);
        expect(c.faq).toHaveLength(3);
        expect(c.intro.length).toBeGreaterThan(80);
        for (const text of [c.headline, c.intro, ...c.benefits.flatMap((b) => [b.title, b.body]), ...c.faq.flatMap((f) => [f.q, f.a])]) {
          // Amharic pages are written in Amharic (a few brand or product names in Latin are fine).
          if (lang === "am") expect(text).toMatch(ethiopic);
          // English pages may quote a short Amharic word, like (ጾም), but are not written in Amharic.
          else expect(text).not.toMatch(/[\u1200-\u137F]{3,}/);
        }
      }
    }
    // The headline names the kind of business.
    expect(SECTOR_PAGES.church.copy.en.headline).toBe("A website for your church in Ethiopia");
  });

  it("structured data is valid JSON with the page's questions and can't close its script tag", () => {
    const c = SECTOR_PAGES.cafe.copy.en;
    const json = sectorJsonLd({ url: "https://app.example/en/website-for/cafe", lang: "en", headline: "</script><b>", description: c.intro, faq: c.faq });
    expect(json).not.toContain("</script>");
    const data = JSON.parse(json) as { "@graph": { "@type": string; mainEntity?: { name: string }[] }[] };
    expect(data["@graph"].map((x) => x["@type"])).toEqual(["WebPage", "FAQPage"]);
    expect(data["@graph"][1]!.mainEntity!.map((q) => q.name)).toEqual(c.faq.map((f) => f.q));
  });

  it("are in the sitemap in both languages", () => {
    const urls = sitemap().map((e) => e.url);
    for (const s of SECTORS) for (const l of ["en", "am"]) expect(urls.some((u) => u.endsWith(`/${l}/website-for/${s}`))).toBe(true);
    expect(urls.some((u) => u.endsWith("/en/showcase"))).toBe(true);
  });
});

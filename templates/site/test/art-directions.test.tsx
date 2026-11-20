import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";
import { siteSchema, themeWarnings } from "../src/lib/schema";
import { themeVariables } from "../src/lib/theme";
import type { Lang, Site } from "../src/lib/types";

const preset = (id: string) => JSON.parse(readFileSync(new URL(`../presets/${id}.json`, import.meta.url), "utf8")) as Site;
const html = (site: Site, lang: Lang = "en", page = 0) => renderToString(<App site={site} page={site.pages[page]!} lang={lang} />);
const text = (s: string) => s.replace(/<[^>]+>/g, "");

describe("art directions (luxe, swiss, bento)", () => {
  it.each(["fashion", "construction", "garage"])("%s is valid and readable", (id) => {
    const site = preset(id);
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(themeWarnings(site.theme)).toEqual([]);
  });

  it("condensed sites set Amharic headings in the narrow Ge'ez cut, other sites in the body font", () => {
    const garage = preset("garage");
    expect(themeVariables(garage.theme, "am")["--site-font-heading"]).toMatch(/^"Noto Sans Ethiopic Narrow"/);
    expect(themeVariables(garage.theme, "en")["--site-font-heading"]).toMatch(/^"Archivo"/);
    expect(themeVariables(preset("fashion").theme, "am")["--site-font-heading"]).toMatch(/^"Noto Sans Ethiopic", system-ui/);
  });

  it("the highlight colour gets readable text on it, and falls back when a theme has none", () => {
    const vars = themeVariables(preset("construction").theme, "en");
    expect(vars["--site-highlight"]).toBe("#F5B800");
    expect(vars["--site-on-highlight"]).toBe("#1c1917");
    expect(themeVariables({ ...preset("construction").theme, highlight: undefined }, "en")["--site-highlight"]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("a price table shows each unit beside its price, in a real table", () => {
    const out = html(preset("construction"));
    expect(out).toContain("<table");
    expect(out).toMatch(/<th colSpan="3" scope="rowgroup" class="price-group">Cement<\/th>/);
    expect(out).toContain('<thead class="sr-only">');
    expect(text(out)).toMatch(/OPC 42\.5.*quintal.*1,850/);
  });

  it("the poster hero sets the business name large but hidden from screen readers, with one h1", () => {
    const out = html(preset("fashion"));
    expect(out).toMatch(/<p aria-hidden="true" class="poster-name[^"]*" style="--chars:5">Tsion Kemis<\/p>/);
    expect(out.match(/<h1/g)).toHaveLength(1);
  });

  it("the bento hero puts hours, both actions and the facts in tiles", () => {
    const out = html(preset("garage"), "am");
    expect(out).toContain("bento-hours");
    expect(out.match(/class="bento-tile bento-(primary|secondary)/g)).toHaveLength(2);
    expect(text(out)).toContain("ከሰኞ እስከ ቅዳሜ");
  });
});

describe("art directions (organic, cinematic, brutal, calm, kinetic)", () => {
  it.each(["bakery", "studio", "training", "pharmacy", "gym"])("%s is valid and readable", (id) => {
    const site = preset(id);
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(themeWarnings(site.theme)).toEqual([]);
  });

  it("pricing cards set one plan apart, with its badge and a filled button", () => {
    const out = html(preset("gym"));
    expect(out.match(/tier-featured/g)).toHaveLength(1);
    expect(out.match(/class="tier card/g)).toHaveLength(3);
    // The badge follows the name in reading order (shown above it with CSS).
    expect(text(out)).toMatch(/Monthly.*Most chosen.*2,500/);
  });

  it("a week timetable groups classes by day, in order, with notes", () => {
    const gym = preset("gym");
    const out = html(gym, "en", gym.pages.findIndex((p) => p.path === "/classes"));
    expect(out).toContain('style="--days:4"');
    expect(out).toMatch(/<ul class="week-grid" tabindex="0" aria-label="This week on the floor"/);
    expect([...out.matchAll(/<h[23] class="item-title week-day-name">([^<]+)</g)].map((m) => m[1])).toEqual(["Monday", "Tuesday", "Thursday", "Saturday"]);
    expect(out.match(/Women only/g)).toHaveLength(2);
  });

  it("prints lay photos askew, and cinematic galleries sit in the dark", () => {
    const bakery = html(preset("bakery"));
    expect(bakery).toContain('<ul class="prints">');
    expect(bakery).toMatch(/class="print reveal" style="--i:0;--tilt:-3deg"/);
    const studio = html(preset("studio"));
    expect(studio).toMatch(/<section[^>]*class="[^"]*on-dark[^"]*"[^>]*>(?:(?!<\/section>).)*class="prints"/s);
  });

  it("the pharmacy names no medicine and shows its licence and pharmacist", () => {
    const site = preset("pharmacy");
    const all = JSON.stringify(site).toLowerCase();
    for (const word of ["paracetamol", "amoxicillin", "ibuprofen", "panadol", "antibiotic"]) expect(all).not.toContain(word);
    expect(text(html(site))).toMatch(/EFDA licence/);
    expect(text(html(site))).toMatch(/Responsible pharmacist/);
  });
});

describe("art direction (grand)", () => {
  it("resort is valid and readable, with the gold readable as small text", () => {
    const site = preset("resort");
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(site.theme.style).toBe("grand");
    expect(themeWarnings(site.theme)).toEqual([]);
    // grand sets labels in the primary colour: a pale gold is refused.
    expect(themeWarnings({ ...site.theme, primary: "#C9A96E" }).join(" ")).toMatch(/small text on theme.background \(grand\)/);
  });

  it("a full-screen photo further down the page is a second heading, not a second h1", () => {
    const out = html(preset("resort"));
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out.match(/class="hero-immersive[^"]*hero-later/g)).toHaveLength(1);
    expect(out).toMatch(/<h2 class="headline split[^"]*"><span[^>]*>.*The/s);
    // The header sits on the first photo only.
    expect(out.match(/header-overlay/g)).toHaveLength(1);
  });

  it("suites, experiences, guests and the closing call carry the hooks the art direction styles", () => {
    const out = html(preset("resort"));
    expect(out.match(/class="feature-row /g)).toHaveLength(3);
    expect(out).toContain("about-grid");
    expect(out.match(/class="testimonial reveal/g)).toHaveLength(3);
    expect(out).toContain('class="cta-section section"');
    expect(out).toContain("footer-wordmark");
    expect(text(out)).toMatch(/The Acacia Suite.*28,000/);
  });

  it("reads in Amharic on every page", () => {
    const site = preset("resort");
    site.pages.forEach((_, i) => {
      const out = text(html(site, "am", i));
      expect(out).toMatch(/[ሀ-፿]/);
      expect(out).not.toMatch(/\bundefined\b/);
    });
  });
});

describe("art direction (avant)", () => {
  it("agency is valid and readable, with the electric colour readable as small text", () => {
    const site = preset("agency");
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(site.theme.style).toBe("avant");
    expect(themeWarnings(site.theme)).toEqual([]);
    expect(themeWarnings({ ...site.theme, primary: "#7B7BFF" }).join(" ")).toMatch(/small text on theme.background \(avant\)/);
  });

  it("the home page carries the hooks the style composes: words-only hero, broken grid, index, showcase, statement", () => {
    const out = html(preset("agency"));
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('class="hero-centered section');
    expect(out).not.toMatch(/class="hero-centered[^"]*"[^>]*>(?:(?!<\/section>).)*<img/s);
    expect(out.match(/class="card pcard/g)).toHaveLength(4);
    expect(out).toContain("card-grid");
    expect(out.match(/class="service-row /g)).toHaveLength(4);
    expect(out.match(/class="feature-row /g)).toHaveLength(2);
    expect(out).toContain('class="quote-section section');
    expect(out).toContain("footer-wordmark");
  });

  it("names no client in the ribbon, and the philosophy quote names no person", () => {
    const site = preset("agency");
    const home = site.pages[0]!.sections;
    const ribbon = home.find((s) => s.type === "marquee");
    expect(ribbon && "items" in ribbon && ribbon.items.map((i) => i.en)).toEqual(["Identity", "Campaigns", "Web", "Motion", "Type", "Film"]);
    const quote = home.find((s) => s.type === "quote");
    expect(quote && "name" in quote ? quote.name : undefined).toBeUndefined();
  });

  it("reads in Amharic on every page", () => {
    const site = preset("agency");
    site.pages.forEach((_, i) => {
      const out = text(html(site, "am", i));
      expect(out).toMatch(/[ሀ-፿]/);
      expect(out).not.toMatch(/\bundefined\b/);
    });
  });
});

describe("art direction (precise)", () => {
  it("software is valid and readable", () => {
    const site = preset("software");
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(site.theme.style).toBe("precise");
    expect(themeWarnings(site.theme)).toEqual([]);
    expect(themeWarnings({ ...site.theme, primary: "#7FD1B5" }).join(" ")).toMatch(/small text on theme.background \(precise\)/);
  });

  it("shows the product as drawings in the site's colours, hidden from screen readers", () => {
    const out = html(preset("software"));
    expect(out.match(/<h1/g)).toHaveLength(1);
    // The hero's product picture is a drawing, not a photo.
    expect(out).toMatch(/class="hero-centered[^"]*"(?:(?!<\/section>).)*<div aria-hidden="true" class="placeholder/s);
    expect(out).toContain("app-bar");
    expect(out).toContain("services-bento");
    expect(out).not.toContain("<img");
  });

  it("puts plans side by side with one chosen, and FAQ on the pricing page", () => {
    const site = preset("software");
    const out = html(site, "en", site.pages.findIndex((p) => p.path === "/pricing"));
    expect(out.match(/tier-featured/g)).toHaveLength(1);
    expect(text(out)).toMatch(/Shop.*Most chosen.*450/);
  });

  it("reads in Amharic on every page", () => {
    const site = preset("software");
    site.pages.forEach((_, i) => {
      const out = text(html(site, "am", i));
      expect(out).toMatch(/[ሀ-፿]/);
      expect(out).not.toMatch(/\bundefined\b/);
    });
  });
});

describe("art direction (monochrome)", () => {
  it("boutique is valid and readable", () => {
    const site = preset("boutique");
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(site.theme.style).toBe("monochrome");
    expect(themeWarnings(site.theme)).toEqual([]);
  });

  it("is a shop: the season to swipe with prices, categories as titles, a one-field newsletter, an order form", () => {
    const site = preset("boutique");
    const out = html(site);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('class="rail"');
    expect(text(out)).toMatch(/Meskel dress.*9,800/);
    expect(out).toContain("index-list");
    const letter = site.pages[0]!.sections.at(-1)!;
    expect(letter.type === "form" && letter.fields.map((f) => f.type)).toEqual(["email"]);
    const order = html(site, "en", site.pages.findIndex((p) => p.path === "/order"));
    expect(order).toMatch(/name="size"/);
  });

  it("reads in Amharic on every page", () => {
    const site = preset("boutique");
    site.pages.forEach((_, i) => {
      const out = text(html(site, "am", i));
      expect(out).toMatch(/[ሀ-፿]/);
      expect(out).not.toMatch(/\bundefined\b/);
    });
  });
});

describe("art direction (drafting)", () => {
  it("architect is valid and readable", () => {
    const site = preset("architect");
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(site.theme.style).toBe("drafting");
    expect(themeWarnings(site.theme)).toEqual([]);
  });

  it("projects carry place, year and area for the title block, and the page has one h1", () => {
    const site = preset("architect");
    const out = html(site);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out.match(/class="hero-immersive[^"]*hero-later/g)).toHaveLength(1);
    expect(text(out)).toMatch(/Entoto Ridge House.*Entoto.*2025.*420 m²/);
  });

  it("reads in Amharic on every page", () => {
    const site = preset("architect");
    site.pages.forEach((_, i) => {
      const out = text(html(site, "am", i));
      expect(out).toMatch(/[ሀ-፿]/);
      expect(out).not.toMatch(/\bundefined\b/);
    });
  });
});

describe("art direction (noir)", () => {
  it("dining is valid and readable as a light-first theme (the style turns it dark)", () => {
    const site = preset("dining");
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(site.theme.style).toBe("noir");
    expect(themeWarnings(site.theme)).toEqual([]);
  });

  it("has signature dishes, a priced menu, the room and a booking form", () => {
    const site = preset("dining");
    const out = html(site);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out.match(/class="feature-row /g)).toHaveLength(3);
    expect(text(out)).toMatch(/Ember tibs.*1,450/);
    const reserve = html(site, "en", site.pages.findIndex((p) => p.path === "/reserve"));
    expect(reserve).toMatch(/name="guests"/);
  });

  it("reads in Amharic on every page", () => {
    const site = preset("dining");
    site.pages.forEach((_, i) => {
      const out = text(html(site, "am", i));
      expect(out).toMatch(/[ሀ-፿]/);
      expect(out).not.toMatch(/\bundefined\b/);
    });
  });
});

describe("art direction (folio)", () => {
  it("folio is valid and readable", () => {
    const site = preset("folio");
    expect(siteSchema.safeParse(site).success).toBe(true);
    expect(site.theme.style).toBe("folio");
    expect(themeWarnings(site.theme)).toEqual([]);
  });

  it("puts the statement first, then work as an index, case studies, skills and experience", () => {
    const site = preset("folio");
    const out = html(site);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain("hero-portrait");
    expect(out).toContain("index-list");
    expect(out.match(/class="feature-row /g)).toHaveLength(2);
    expect(text(out)).toMatch(/Front-end lead/);
  });

  it("reads in Amharic on every page", () => {
    const site = preset("folio");
    site.pages.forEach((_, i) => {
      const out = text(html(site, "am", i));
      expect(out).toMatch(/[ሀ-፿]/);
      expect(out).not.toMatch(/\bundefined\b/);
    });
  });
});

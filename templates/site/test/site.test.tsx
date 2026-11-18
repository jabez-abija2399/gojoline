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
    // Hero words are animated one by one but read as one line of text.
    expect(page.html.replace(/<[^>]+>/g, "")).toContain("በየማለዳው የሚቆላ ቡና");
  });
  it("promotes the first heading to h1 on pages without a hero", () => {
    const html = render("/menu")!.html;
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>Our menu<\/h1>/);
  });
  it("formats non-Birr prices with the right symbol", () => {
    expect(formatPrice({ amountMinor: 1250, currency: "USD" }, "en")).toBe("$12.50");
  });
  it("adds LocalBusiness structured data on the home page, safely escaped", () => {
    const head = render("/")!.head;
    const json = /<script type="application\/ld\+json">(.*?)<\/script>/.exec(head)?.[1];
    expect(JSON.parse(json!)).toMatchObject({ "@type": "LocalBusiness", name: "Bole Buna House", telephone: "+251 911 234 567" });
    const original = site.name.en;
    site.name.en = "</script><script>alert(1)</script>";
    try {
      expect(render("/")!.head).not.toContain("</script><script>");
    } finally {
      site.name.en = original;
    }
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

describe("drawings, questions and the closing band", () => {
  const withHome = (sections: unknown[]) => ({ ...site, pages: [{ ...site.pages[0]!, sections }, ...site.pages.slice(1)] });
  const hero = site.pages[0]!.sections[0]!;

  it("accepts an image drawing, a faq and a cta", () => {
    const next = withHome([
      { ...hero, image: { art: "coffee", alt: { en: "A coffee pot" } } },
      { type: "faq", heading: { en: "Good to know" }, items: [{ question: { en: "Do you deliver?" }, answer: { en: "Yes." } }] },
      { type: "cta", heading: { en: "Come by" }, primaryAction: { label: { en: "Call" }, href: "tel:+251911234567" } },
    ]);
    expect(siteSchema.safeParse(next).success).toBe(true);
  });
  it("refuses a drawing that doesn't exist, an empty faq and a cta with an unsafe link", () => {
    expect(siteSchema.safeParse(withHome([{ ...hero, image: { art: "dragon", alt: { en: "x" } } }])).success).toBe(false);
    expect(siteSchema.safeParse(withHome([hero, { type: "faq", heading: { en: "Q" }, items: [] }])).success).toBe(false);
    expect(siteSchema.safeParse(withHome([hero, { type: "cta", heading: { en: "Go" }, primaryAction: { label: { en: "Go" }, href: "javascript:alert(1)" } }])).success).toBe(false);
  });
  it("preloads the heading font on English pages and the Ge'ez font on Amharic ones", () => {
    expect(render("/")!.head).toMatch(/fonts\/(fraunces|outfit|nunito)-latin\.woff2/);
    expect(render("/am")!.head).not.toMatch(/-latin\.woff2/);
  });
  it("shows the call bar only when there is a way to reach the business", () => {
    expect(render("/")!.html).toContain("sticky-actions");
    const b = site.business;
    const saved = { phone: b.phone, telegram: b.telegram, whatsapp: b.whatsapp };
    b.phone = b.telegram = b.whatsapp = undefined;
    try {
      expect(render("/")!.html).not.toContain("sticky-actions");
    } finally {
      Object.assign(b, saved);
    }
  });
});

describe("niche sections", () => {
  const base = { name: { en: "T" }, languages: ["en"], theme: { primary: "#8A4B24", accent: "#2F3E2E", background: "#FBF7F2", text: "#1F1A17", font: "elegant", radius: "none", style: "editorial" }, business: {} };
  const page = (sections: unknown[]) => ({ ...base, pages: [{ path: "/", title: { en: "Home" }, sections }] });
  it("accepts cards, stats, steps, schedule and quote", () => {
    const result = siteSchema.safeParse(
      page([
        { type: "hero", variant: "immersive", heading: { en: "H" }, image: { src: "/stock/hotel-hero-lodge-pool-dusk.webp", alt: { en: "a" } }, facts: [{ value: { en: "12" }, label: { en: "rooms" } }] },
        { type: "cards", layout: "feature", heading: { en: "Rooms" }, items: [{ title: { en: "Room" }, price: { amountMinor: 350000, currency: "ETB" }, priceNote: { en: "per night" }, meta: [{ en: "2 guests" }], badge: { en: "New" } }] },
        { type: "stats", items: [{ value: { en: "1" }, label: { en: "a" } }, { value: { en: "2" }, label: { en: "b" } }] },
        { type: "steps", heading: { en: "How" }, items: [{ title: { en: "One" } }, { title: { en: "Two" } }] },
        { type: "schedule", layout: "tiles", heading: { en: "Times" }, items: [{ time: { en: "5:10" }, title: { en: "Fajr" } }] },
        { type: "quote", quote: { en: "Q" } },
      ]),
    );
    expect(result.success).toBe(true);
  });
  it("rejects unknown layouts, styles and too many facts", () => {
    expect(siteSchema.safeParse(page([{ type: "cards", layout: "carousel", heading: { en: "x" }, items: [{ title: { en: "x" } }] }])).success).toBe(false);
    expect(siteSchema.safeParse({ ...page([{ type: "quote", quote: { en: "Q" } }]), theme: { ...base.theme, style: "fancy" } }).success).toBe(false);
    const fact = { value: { en: "1" }, label: { en: "a" } };
    expect(siteSchema.safeParse(page([{ type: "hero", heading: { en: "H" }, facts: [fact, fact, fact, fact, fact] }])).success).toBe(false);
  });
});

describe("Made with Gojoline badge", () => {
  it("shows a pill linking to Gojoline in the page's language", () => {
    const en = render("/")!.html;
    expect(en).toMatch(/<a href="\/en"[^>]*data-gojoline-badge/);
    expect(en).toContain("Made with Gojoline");
    const am = render("/am")!.html;
    expect(am).toMatch(/<a href="\/am"[^>]*data-gojoline-badge/);
    expect(am).toContain("በጎጆላይን የተሠራ");
  });
  it("can't be switched off from site.json (the plan decides at publish)", () => {
    const before = site.meta;
    site.meta = { ...(before ?? {}), badge: false };
    try {
      expect(render("/")!.html).toContain("data-gojoline-badge");
    } finally {
      site.meta = before;
    }
  });
  it("fills the page language into the published link", async () => {
    const { badgeHref } = await import("../src/lib/meta");
    expect(badgeHref("am", "https://app.example/{lang}?ref=site_bole&utm_source=gojoline_badge")).toBe("https://app.example/am?ref=site_bole&utm_source=gojoline_badge");
  });
});

describe("share preview (Telegram, Facebook)", () => {
  it("has title, description, site name, locale and the hero photo as image", () => {
    const original = site.meta;
    site.meta = { ...(original ?? {}), url: "https://bole.example" };
    try {
      const am = render("/am")!.head;
      expect(am).toContain('<meta property="og:locale" content="am_ET">');
      expect(am).toContain('<meta property="og:locale:alternate" content="en_US">');
      expect(am).toContain('<meta property="og:site_name" content="ቦሌ ቡና ቤት">');
      expect(am).toContain('<meta property="og:url" content="https://bole.example/am">');
      const en = render("/")!.head;
      expect(en).toMatch(/<meta property="og:title" content="[^"]+">/);
      expect(en).toMatch(/<meta property="og:description" content="[^"]+">/);
      const hero = site.pages[0]!.sections.find((s) => s.type === "hero");
      const src = hero?.type === "hero" ? hero.image?.src : undefined;
      if (src) {
        expect(en).toContain(`<meta property="og:image" content="https://bole.example${src}">`);
        expect(en).toContain('<meta name="twitter:card" content="summary_large_image">');
      } else {
        expect(en).toContain('<meta name="twitter:card" content="summary">');
      }
    } finally {
      site.meta = original;
    }
  });
  it("prefers the owner's chosen picture, and ignores anything that isn't a site photo", async () => {
    const { shareImage } = await import("../src/entry-server");
    const page = site.pages[0]!;
    expect(shareImage(page, "en", "/images/front.webp")).toEqual({ src: "/images/front.webp", alt: "" });
    const hero = page.sections.find((s) => s.type === "hero");
    if (hero?.type === "hero") {
      const before = hero.image;
      hero.image = { src: "https://evil.example/x.png", alt: { en: "x" } };
      try {
        expect(shareImage({ ...page }, "en")).toBeNull();
      } finally {
        hero.image = before;
      }
    }
  });
});

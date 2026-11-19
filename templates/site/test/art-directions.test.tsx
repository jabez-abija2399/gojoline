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
    expect(text(out)).toMatch(/Most chosen.*Monthly.*2,500/);
  });

  it("a week timetable groups classes by day, in order, with notes", () => {
    const gym = preset("gym");
    const out = html(gym, "en", gym.pages.findIndex((p) => p.path === "/classes"));
    expect(out).toContain('style="--days:4"');
    expect([...out.matchAll(/class="week-day-name">([^<]+)</g)].map((m) => m[1])).toEqual(["Monday", "Tuesday", "Thursday", "Saturday"]);
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

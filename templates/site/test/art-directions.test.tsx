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
    expect(out).toMatch(/<caption[^>]*>Cement<\/caption>/);
    expect(text(out)).toMatch(/OPC 42\.5.*quintal.*1,850/);
  });

  it("the poster hero sets the business name large but hidden from screen readers, with one h1", () => {
    const out = html(preset("fashion"));
    expect(out).toMatch(/<p aria-hidden="true" class="poster-name[^"]*" style="--chars:11">Tsion Kemis<\/p>/);
    expect(out.match(/<h1/g)).toHaveLength(1);
  });

  it("the bento hero puts hours, both actions and the facts in tiles", () => {
    const out = html(preset("garage"), "am");
    expect(out).toContain("bento-hours");
    expect(out.match(/class="bento-tile bento-(primary|secondary)/g)).toHaveLength(2);
    expect(text(out)).toContain("ከሰኞ እስከ ቅዳሜ");
  });
});

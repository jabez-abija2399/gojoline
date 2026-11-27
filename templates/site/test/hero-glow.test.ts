import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

// `.hero-glow` is the soft light behind a hero, but the class sits on the split, centred and
// portrait hero sections themselves: hiding it hides the whole first screen. Styles may only
// change its background.
const dir = new URL("../src/", import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith(".css"));

describe("hero glow", () => {
  it.each(files)("%s never hides an element by its .hero-glow class", (file) => {
    const css = readFileSync(new URL(file, dir), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const hiding = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selector, body]) => /\.hero-glow(?=\s*(,|\)|$))/.test(selector.trim()) && /display\s*:\s*none|visibility\s*:\s*hidden/.test(body))
      .map(([, selector]) => selector.trim());
    expect(hiding).toEqual([]);
  });

  // The same fix must not bring back the brand mark these styles hide.
  it.each([["design.css", "luxe"], ["grand.css", "grand"], ["monochrome.css", "monochrome"], ["drafting.css", "drafting"], ["noir.css", "noir"], ["estate.css", "estate"], ["voyage.css", "voyage"]])("%s still hides the %s brand mark", (file, style) => {
    const css = readFileSync(new URL(file, dir), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector, body]) => selector.includes(`[data-style="${style}"] .brand-mark`) && /display\s*:\s*none/.test(body));
    expect(rules.length).toBeGreaterThan(0);
  });
});

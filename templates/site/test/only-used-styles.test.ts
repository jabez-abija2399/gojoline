import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { describe, expect, it } from "vitest";
import { onlyUsedStyles } from "../scripts/only-used-styles";

const plugin: Plugin = onlyUsedStyles();
const grandCss = fileURLToPath(new URL("../src/grand.css", import.meta.url));
const style = (JSON.parse(readFileSync(new URL("../src/site.json", import.meta.url), "utf8")) as { theme: { style?: string } }).theme.style;
const load = (id: string) => (plugin.load as (this: { addWatchFile: () => void }, id: string) => string | null).call({ addWatchFile: () => {} }, id);

describe("styles that ship only to the sites that use them", () => {
  it("grand.css is empty unless site.json asks for grand", () => {
    const out = load(grandCss);
    if (style === "grand") expect(out).toContain('[data-style="grand"]');
    else expect(out).toBe("");
  });

  it("leaves every other file to Vite", () => {
    expect(load(fileURLToPath(new URL("../src/design.css", import.meta.url)))).toBeNull();
  });

  it("every grand rule is scoped to the style, so dropping the file changes no other site", () => {
    const css = readFileSync(grandCss, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/(^|})\s*([^@{}][^{}]*)\{/g)].map((m) => m[2]!.trim()).filter((s) => !/^(@|from\b|to\b|\d+%)/.test(s));
    expect(selectors.length).toBeGreaterThan(50);
    for (const sel of selectors) for (const part of sel.split(/,(?![^(]*\))/)) expect(part, part).toContain('[data-style="grand"]');
  });
});

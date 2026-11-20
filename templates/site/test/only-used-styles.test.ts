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

  it.each(["grand", "avant", "precise", "monochrome"])("every %s rule is scoped to the style, so dropping the file changes no other site", (name) => {
    const css = readFileSync(fileURLToPath(new URL(`../src/${name}.css`, import.meta.url)), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/(^|})\s*([^@{}][^{}]*)\{/g)].map((m) => m[2]!.trim()).filter((s) => !/^(@|from\b|to\b|\d+%)/.test(s));
    expect(selectors.length).toBeGreaterThan(50);
    for (const sel of selectors) for (const part of sel.split(/,(?![^(]*\))/)) expect(part, part).toContain(`[data-style="${name}"]`);
  });

  it("avant.css is empty unless site.json asks for avant", () => {
    const out = load(fileURLToPath(new URL("../src/avant.css", import.meta.url)));
    if (style === "avant") expect(out).toContain('[data-style="avant"]');
    else expect(out).toBe("");
  });

  it("the software drawings are built only into a site that shows one", () => {
    const out = load(fileURLToPath(new URL("../src/components/art-app.tsx", import.meta.url)));
    const site = readFileSync(new URL("../src/site.json", import.meta.url), "utf8");
    if (/"art"\s*:\s*"(dashboard|mobile|chart)"/.test(site)) expect(out).toBeNull();
    else expect(out).toBe("export const appScenes = {};");
  });
});

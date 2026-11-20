import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";
import type { Site } from "../src/lib/types";
import { onlyUsedStyles } from "../scripts/only-used-styles";

const style = (JSON.parse(readFileSync(new URL("../src/site.json", import.meta.url), "utf8")) as { theme: { style?: string } }).theme.style;
const load = (id: string) => (onlyUsedStyles().load as (this: { addWatchFile: () => void }, id: string) => string | null).call({ addWatchFile: () => {} }, id);

describe("the avant pointer script", () => {
  it("is replaced by an empty stand-in when the site is neither avant nor folio", () => {
    const out = load(fileURLToPath(new URL("../src/components/pointer.ts", import.meta.url)));
    if (style === "avant" || style === "folio") expect(out).toBeNull();
    else expect(out).toBe("export function startPointer() { return () => {}; }");
  });

  it("stays off for touch screens and for visitors who ask for less motion, and ignores fingers", () => {
    const src = readFileSync(new URL("../src/components/pointer.ts", import.meta.url), "utf8");
    expect(src).toContain('matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)")');
    expect(src).toContain('e.pointerType !== "mouse"');
  });

  it("adds nothing to the server-rendered page", () => {
    const site = JSON.parse(readFileSync(new URL("../presets/agency.json", import.meta.url), "utf8")) as Site;
    expect(renderToString(<App site={site} page={site.pages[0]!} lang="en" />)).not.toContain("cursor-ring");
  });

  it("after a hero with no photo, the introduction's picture loads first", () => {
    const site = JSON.parse(readFileSync(new URL("../presets/agency.json", import.meta.url), "utf8")) as Site;
    const out = renderToString(<App site={site} page={site.pages[0]!} lang="am" />);
    expect(out).toMatch(/<img[^>]*personal-gallery-lettering-sketches[^>]*loading="eager"[^>]*fetchPriority="high"/);
  });
});

import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";
import type { Site } from "../src/lib/types";

describe("the avant pointer script", () => {
  it("is loaded on demand, not in the page's main code", () => {
    const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
    expect(app).toMatch(/import\("\.\/components\/pointer"\)/);
    expect(app).not.toMatch(/from "\.\/components\/pointer"/);
  });

  it("stays off for touch screens and for visitors who ask for less motion", () => {
    const src = readFileSync(new URL("../src/components/pointer.ts", import.meta.url), "utf8");
    expect(src).toContain('matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)")');
  });

  it("adds nothing to the server-rendered page", () => {
    const site = JSON.parse(readFileSync(new URL("../presets/agency.json", import.meta.url), "utf8")) as Site;
    expect(renderToString(<App site={site} page={site.pages[0]!} lang="en" />)).not.toContain("cursor-ring");
  });
});

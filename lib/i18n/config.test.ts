import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage, swapLocaleInPath } from "./config";
import { am } from "./messages/am";
import { en } from "./messages/en";
import { format } from "./format";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : keys(v as object, `${prefix}${k}.`),
  );
}

describe("locale negotiation", () => {
  it.each([
    [null, "en"],
    ["am-ET,am;q=0.9,en;q=0.8", "am"],
    ["en-US,en;q=0.9", "en"],
    ["fr-FR,am;q=0.5", "am"],
    ["fr-FR", "en"],
    ["am;q=0", "en"],
  ])("%s -> %s", (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected);
  });

  it("swaps the locale segment", () => {
    expect(swapLocaleInPath("/en", "am")).toBe("/am");
    expect(swapLocaleInPath("/en/app/projects", "am")).toBe("/am/app/projects");
    expect(swapLocaleInPath("/", "am")).toBe("/am");
  });
});

describe("catalogs", () => {
  it("Amharic has every English key and no empty strings", () => {
    expect(keys(am).sort()).toEqual(keys(en).sort());
    for (const catalog of [en, am]) {
      for (const key of keys(catalog)) {
        const value = key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], catalog);
        expect(String(value).trim(), key).not.toBe("");
      }
    }
  });

  it("Amharic strings are written in Ge'ez script", () => {
    expect(am.landing.hero.title).toMatch(/[ሀ-፿]/);
  });

  it("formats placeholders", () => {
    expect(format("© {year} Gojoline {x}", { year: 2026 })).toBe("© 2026 Gojoline {x}");
  });
});

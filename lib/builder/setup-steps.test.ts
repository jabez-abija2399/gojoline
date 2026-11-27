import { describe, expect, it } from "vitest";
import { presetVersionFiles } from "@/lib/template/presets";
import { setupSections } from "./setup-steps";

const KNOWN = ["hero", "about", "menu", "gallery", "contact", "map", "form"];

describe("setupSections", () => {
  it("lists the home page's section kinds in order, each once, only known ones", () => {
    const json = JSON.stringify({ pages: [{ path: "/about", sections: [{ type: "faq" }] }, { path: "/", sections: [{ type: "hero" }, { type: "menu" }, { type: "weird" }, { type: "menu" }, { type: "map" }] }] });
    expect(setupSections(json, KNOWN)).toEqual(["hero", "menu", "map"]);
  });
  it("caps the list and survives broken input", () => {
    const json = JSON.stringify({ pages: [{ path: "/", sections: KNOWN.map((type) => ({ type })) }] });
    expect(setupSections(json, KNOWN, 3)).toEqual(["hero", "about", "menu"]);
    expect(setupSections("{not json", KNOWN)).toEqual([]);
    expect(setupSections("{}", KNOWN)).toEqual([]);
  });
  it("reads a real template", () => {
    const steps = setupSections(presetVersionFiles("cafe")["src/site.json"]!, KNOWN);
    expect(steps[0]).toBe("hero");
    expect(steps.length).toBeGreaterThan(2);
  });
});

import { describe, expect, it } from "vitest";
import { missingForms } from "./forms-check.mts";

describe("forms-check", () => {
  const site = JSON.stringify({ pages: [{ sections: [{ type: "hero" }, { type: "form", id: "booking" }] }, { sections: [{ type: "form", id: "order" }, { type: "form" }] }] });
  it("lists form ids the site shows but the Data API doesn't know", () => {
    expect(missingForms(site, ["booking"])).toEqual(["order", "?"]);
    expect(missingForms(site, ["booking", "order", "?"])).toEqual([]);
  });
  it("ignores sites without forms or with bad JSON", () => {
    expect(missingForms(null, [])).toEqual([]);
    expect(missingForms("{", [])).toEqual([]);
    expect(missingForms(JSON.stringify({ pages: [{ sections: [{ type: "menu" }] }] }), [])).toEqual([]);
  });
});

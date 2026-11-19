import { describe, expect, it } from "vitest";
import { missingForms } from "./forms-check.mts";

const form = (id: string) => ({ type: "form", id, kind: "booking", heading: { en: "Book" }, fields: [{ name: "name", label: { en: "Name" }, type: "text" }], submitLabel: { en: "Send" }, successMessage: { en: "Thanks" } });

describe("forms-check", () => {
  const site = JSON.stringify({ pages: [{ sections: [{ type: "hero" }, form("booking")] }, { sections: [form("order"), { type: "form" }] }] });
  it("lists form ids the site shows but the Data API doesn't know", () => {
    expect(missingForms(site, [{ formKey: "booking", definition: form("booking") }])).toEqual(["order", "?"]);
    expect(missingForms(site, [{ formKey: "booking", definition: form("booking") }, { formKey: "order", definition: form("order") }])).toEqual(["?"]);
  });
  it("lists saved definitions the current schema no longer reads", () => {
    const old = { ...form("booking"), fields: [] };
    expect(missingForms(site, [{ formKey: "booking", definition: old }, { formKey: "order", definition: form("order") }])).toEqual(["booking", "?"]);
  });
  it("ignores sites without forms or with bad JSON", () => {
    expect(missingForms(null, [])).toEqual([]);
    expect(missingForms("{", [])).toEqual([]);
    expect(missingForms(JSON.stringify({ pages: [{ sections: [{ type: "menu" }] }] }), [])).toEqual([]);
  });
});

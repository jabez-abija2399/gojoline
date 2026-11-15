import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkSubmission, extractForms } from "./forms";

const starter = readFileSync("templates/site/src/site.json", "utf8");

describe("extractForms", () => {
  it("reads the template's starter booking form (schemas stay in sync)", () => {
    const forms = extractForms(starter);
    expect(forms.map((f) => f.id)).toEqual(["booking"]);
    expect(forms[0]!.fields.map((f) => f.name)).toEqual(["name", "phone", "date", "guests"]);
  });
  it("ignores bad JSON and invalid forms", () => {
    expect(extractForms("{")).toEqual([]);
    expect(extractForms(JSON.stringify({ pages: [{ sections: [{ type: "form", id: "x" }] }] }))).toEqual([]);
  });
});

describe("checkSubmission", () => {
  const form = extractForms(starter)[0]!;
  it("accepts valid answers and drops unknown fields", () => {
    expect(checkSubmission(form, { name: " Abebe ", phone: "0911 234 567", date: "2026-12-01", guests: "4", extra: "x" })).toEqual({
      ok: true,
      data: { name: "Abebe", phone: "0911 234 567", date: "2026-12-01", guests: "4" },
    });
  });
  it.each([
    [{ phone: "0911234567", date: "2026-12-01" }, "name"],
    [{ name: "A", phone: "call me", date: "2026-12-01" }, "phone"],
    [{ name: "A", phone: "0911234567", date: "tomorrow" }, "date"],
    [{ name: "A", phone: "0911234567", date: "2026-12-01", guests: "lots" }, "guests"],
    [{ name: "x".repeat(301), phone: "0911234567", date: "2026-12-01" }, "name"],
  ])("rejects %j at %s", (answers, field) => {
    expect(checkSubmission(form, answers)).toEqual({ ok: false, field });
  });
  it("checks select options and emails", () => {
    const f = { ...form, fields: [{ name: "size", label: { en: "Size" }, type: "select" as const, options: [{ en: "Small", am: "ትንሽ" }] }, { name: "email", label: { en: "E" }, type: "email" as const }] };
    expect(checkSubmission(f, { size: "ትንሽ", email: "a@b.co" }).ok).toBe(true);
    expect(checkSubmission(f, { size: "Huge" })).toEqual({ ok: false, field: "size" });
    expect(checkSubmission(f, { email: "nope" })).toEqual({ ok: false, field: "email" });
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formFieldSchema, formSectionSchema, siteSchema } from "@/templates/site/src/lib/schema";
import { PRESET_IDS, presetSiteJson } from "@/lib/template/presets";
import { checkSubmission, extractForms, scanForms } from "./forms";

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

/** One form per field type with every optional property the template allows set. */
const FIELD_TYPES = formFieldSchema.shape.type.options;
const fullField = (type: (typeof FIELD_TYPES)[number], i: number) => ({
  name: `f_${i}`,
  label: { en: "Label", am: "መለያ" },
  type,
  required: true,
  options: [{ en: "One", am: "አንድ" }],
});
const fullForm = (kind: string, type: (typeof FIELD_TYPES)[number]) => ({
  type: "form",
  id: `form-${kind}-${type}`,
  kind,
  eyebrow: { en: "Book a table", am: "ጠረጴዛ ይያዙ" },
  heading: { en: "Reserve", am: "ይያዙ" },
  intro: { en: "We call back", am: "እንደውላለን" },
  fields: FIELD_TYPES.map((t, i) => fullField(t, i)).concat(fullField(type, 99)),
  submitLabel: { en: "Send", am: "ላክ" },
  successMessage: { en: "Thanks", am: "እናመሰግናለን" },
});

describe("template and cloud form schemas (one definition, no drift)", () => {
  it("the samples set every property the template's form and field schemas have", () => {
    expect(Object.keys(fullForm("booking", "text")).sort()).toEqual(Object.keys(formSectionSchema.shape).sort());
    expect(Object.keys(fullField("select", 0)).sort()).toEqual(Object.keys(formFieldSchema.shape).sort());
  });
  const kinds = formSectionSchema.shape.kind.options;
  const cases = kinds.flatMap((kind) => FIELD_TYPES.map((type) => [kind, type] as const));
  it.each(cases)("a %s form with a %s field the template builds is registered", (kind, type) => {
    const form = fullForm(kind, type);
    const site = { name: { en: "S" }, languages: ["en", "am"], theme: { primary: "#8A4B24", accent: "#1F2937", background: "#FFFFFF", text: "#111111", font: "modern", radius: "small" }, business: {}, pages: [{ path: "/", title: { en: "Home" }, sections: [form] }] };
    expect(siteSchema.safeParse(site).success).toBe(true);
    const scan = scanForms(JSON.stringify(site));
    expect(scan.invalid).toEqual([]);
    expect(scan.forms).toEqual([form]);
  });
  it.each(PRESET_IDS)("every form in the %s preset is registered", (id) => {
    expect(scanForms(presetSiteJson(id)).invalid).toEqual([]);
  });
  it("reports forms it can't register instead of dropping them silently", () => {
    const bad = { pages: [{ sections: [{ type: "form", id: "booking", fields: [] }, { type: "form" }, { type: "hero" }] }] };
    expect(scanForms(JSON.stringify(bad))).toEqual({ forms: [], invalid: ["booking", "?"] });
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

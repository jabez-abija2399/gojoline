import { z } from "zod";

import { formFieldSchema, formSectionSchema } from "@/templates/site/src/lib/schema";

/**
 * Form definitions as written in site.json. One definition: the site template's own form schema
 * (templates/site/src/lib/schema.ts), so anything a site can build with is registered at publish.
 * A copy here once missed `eyebrow`, and forms with one were dropped silently (2026-11-19).
 */
export const formFieldDef = formFieldSchema;
export const formDef = formSectionSchema;

export type FormDef = z.infer<typeof formDef>;

export interface FormScan {
  forms: FormDef[];
  /** Form sections that can't be registered (id, or "?" when it has none): publishing stops. */
  invalid: string[];
}

/** Every form section in a site.json, registrable or not. Bad JSON yields nothing. */
export function scanForms(siteJson: string): FormScan {
  let site: unknown;
  try {
    site = JSON.parse(siteJson);
  } catch {
    return { forms: [], invalid: [] };
  }
  const pages = (site as { pages?: unknown })?.pages;
  const forms: FormDef[] = [];
  const invalid: string[] = [];
  for (const page of Array.isArray(pages) ? pages : []) {
    const sections = (page as { sections?: unknown })?.sections;
    for (const section of Array.isArray(sections) ? sections : []) {
      if ((section as { type?: unknown })?.type !== "form") continue;
      const parsed = formDef.safeParse(section);
      const id = (section as { id?: unknown }).id;
      if (!parsed.success) invalid.push(typeof id === "string" ? id : "?");
      else if (forms.some((f) => f.id === parsed.data.id)) invalid.push(parsed.data.id);
      else forms.push(parsed.data);
    }
  }
  return { forms, invalid };
}

/** All valid forms in a site.json. Publishing uses `scanForms` so an invalid one stops it. */
export function extractForms(siteJson: string): FormDef[] {
  return scanForms(siteJson).forms;
}

const MAX = { textarea: 2000, default: 300 };

export type SubmissionCheck = { ok: true; data: Record<string, string> } | { ok: false; field: string };

/** Checks visitor answers against the owner's form. Unknown fields are dropped. */
export function checkSubmission(form: FormDef, answers: unknown): SubmissionCheck {
  const input = (answers && typeof answers === "object" ? answers : {}) as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const f of form.fields) {
    const raw = input[f.name];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (f.required) return { ok: false, field: f.name };
      continue;
    }
    if (value.length > (f.type === "textarea" ? MAX.textarea : MAX.default)) return { ok: false, field: f.name };
    const valid =
      f.type === "email" ? z.email().safeParse(value).success
      : f.type === "tel" ? /^[+\d][\d\s\-()]{5,20}$/.test(value)
      : f.type === "number" ? /^-?\d{1,9}(\.\d{1,2})?$/.test(value)
      : f.type === "date" ? /^\d{4}-\d{2}-\d{2}$/.test(value)
      : f.type === "time" ? /^\d{2}:\d{2}$/.test(value)
      : f.type === "select" ? (f.options ?? []).some((o) => o.en === value || o.am === value)
      : true;
    if (!valid) return { ok: false, field: f.name };
    data[f.name] = value;
  }
  return { ok: true, data };
}

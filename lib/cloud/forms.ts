import { z } from "zod";

/**
 * Form definitions as written in site.json (mirrors templates/site/src/lib/schema.ts; a test
 * checks the template's starter forms parse here). Captured at publish time.
 */
const text = z.object({ en: z.string().max(4000).optional(), am: z.string().max(4000).optional() }).strict();

export const formFieldDef = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9_]{0,30}$/),
    label: text,
    type: z.enum(["text", "email", "tel", "date", "time", "number", "select", "textarea"]),
    required: z.boolean().optional(),
    options: z.array(text).min(1).max(30).optional(),
  })
  .strict();

export const formDef = z
  .object({
    type: z.literal("form"),
    id: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/),
    kind: z.enum(["contact", "booking", "order", "registration"]),
    heading: text,
    intro: text.optional(),
    fields: z.array(formFieldDef).min(1).max(15),
    submitLabel: text,
    successMessage: text,
  })
  .strict();

export type FormDef = z.infer<typeof formDef>;

/** All valid forms in a site.json (invalid ones are skipped; the build already rejects them). */
export function extractForms(siteJson: string): FormDef[] {
  let site: unknown;
  try {
    site = JSON.parse(siteJson);
  } catch {
    return [];
  }
  const pages = (site as { pages?: { sections?: unknown[] }[] })?.pages ?? [];
  const forms: FormDef[] = [];
  for (const page of pages) {
    for (const section of page.sections ?? []) {
      const parsed = formDef.safeParse(section);
      if (parsed.success && !forms.some((f) => f.id === parsed.data.id)) forms.push(parsed.data);
    }
  }
  return forms;
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

import { z } from "zod";

/** Owner-editable lists (menu items, services) inside site.json, edited without the AI. */
type Lang = "en" | "am";
type Text = Partial<Record<Lang, string>>;

export interface ListItem {
  /** Position in the original list, so fields the dashboard doesn't edit (tags, icons) stay with the item. */
  ref: number | null;
  name: Text;
  description: Text;
  /** Whole Birr or with cents, as minor units; null = no price shown. */
  priceMinor: number | null;
}

export interface EditableList {
  /** Stable pointer into site.json: "p0.s2.c1" (menu category) or "p0.s3" (services). */
  key: string;
  kind: "menu" | "services";
  /** Section heading and, for menus, the category name. */
  title: Text;
  items: ListItem[];
}

interface RawSite {
  languages?: string[];
  pages?: { title?: Text; sections?: Record<string, unknown>[] }[];
}

const textOf = (v: unknown): Text => (v && typeof v === "object" ? (v as Text) : {});
const priceOf = (v: unknown): number | null => {
  const p = v as { amountMinor?: unknown } | undefined;
  return typeof p?.amountMinor === "number" ? p.amountMinor : null;
};

export function readLists(siteJson: string): { languages: Lang[]; lists: EditableList[] } | null {
  let site: RawSite;
  try {
    site = JSON.parse(siteJson) as RawSite;
  } catch {
    return null;
  }
  const languages = (site.languages ?? ["en"]).filter((l): l is Lang => l === "en" || l === "am");
  const lists: EditableList[] = [];
  (site.pages ?? []).forEach((page, pi) => {
    (page.sections ?? []).forEach((section, si) => {
      if (section.type === "menu" && Array.isArray(section.categories)) {
        (section.categories as Record<string, unknown>[]).forEach((cat, ci) => {
          const heading = textOf(section.heading);
          const name = textOf(cat.name);
          lists.push({
            key: `p${pi}.s${si}.c${ci}`,
            kind: "menu",
            title: { en: [heading.en, name.en].filter(Boolean).join(" · "), am: [heading.am, name.am].filter(Boolean).join(" · ") },
            items: ((cat.items as Record<string, unknown>[]) ?? []).map((it, i) => ({ ref: i, name: textOf(it.name), description: textOf(it.description), priceMinor: priceOf(it.price) })),
          });
        });
      }
      if (section.type === "services" && Array.isArray(section.items)) {
        lists.push({
          key: `p${pi}.s${si}`,
          kind: "services",
          title: textOf(section.heading),
          items: (section.items as Record<string, unknown>[]).map((it, i) => ({ ref: i, name: textOf(it.title), description: textOf(it.description), priceMinor: priceOf(it.price) })),
        });
      }
    });
  });
  return { languages, lists };
}

const text = z.object({ en: z.string().trim().max(300).optional(), am: z.string().trim().max(300).optional() }).strict();
export const listEditSchema = z
  .object({
    key: z.string().regex(/^p\d{1,2}\.s\d{1,2}(\.c\d{1,2})?$/),
    items: z
      .array(
        z
          .object({
            ref: z.number().int().nonnegative().max(200).nullable(),
            name: text,
            description: text,
            priceMinor: z.number().int().nonnegative().max(1_000_000_000).nullable(),
          })
          .strict(),
      )
      .max(80),
  })
  .strict();
export type ListEdit = z.infer<typeof listEditSchema>;

const clean = (t: Text): Text | undefined => {
  const out: Text = {};
  if (t.en?.trim()) out.en = t.en.trim();
  if (t.am?.trim()) out.am = t.am.trim();
  return Object.keys(out).length ? out : undefined;
};

/** Applies one list edit and returns the new site.json text, or an error code. */
export function applyListEdit(siteJson: string, edit: ListEdit): { ok: true; json: string } | { ok: false; error: "invalid" | "not_found" | "name_required" } {
  let site: RawSite;
  try {
    site = JSON.parse(siteJson) as RawSite;
  } catch {
    return { ok: false, error: "invalid" };
  }
  const m = /^p(\d+)\.s(\d+)(?:\.c(\d+))?$/.exec(edit.key)!;
  const section = site.pages?.[Number(m[1])]?.sections?.[Number(m[2])];
  if (!section) return { ok: false, error: "not_found" };
  if (edit.items.some((i) => !clean(i.name))) return { ok: false, error: "name_required" };
  const price = (p: number | null) => (p === null ? undefined : { amountMinor: p, currency: "ETB" });

  if (m[3] !== undefined) {
    if (section.type !== "menu") return { ok: false, error: "not_found" };
    const cat = (section.categories as Record<string, unknown>[] | undefined)?.[Number(m[3])];
    if (!cat) return { ok: false, error: "not_found" };
    const old = (cat.items as Record<string, unknown>[]) ?? [];
    cat.items = edit.items.map((it) => strip({ ...(it.ref === null ? {} : (old[it.ref] ?? {})), name: clean(it.name), description: clean(it.description), price: price(it.priceMinor) }));
  } else {
    if (section.type !== "services") return { ok: false, error: "not_found" };
    const old = (section.items as Record<string, unknown>[]) ?? [];
    section.items = edit.items.map((it) =>
      strip({ ...(it.ref === null ? {} : (old[it.ref] ?? {})), title: clean(it.name), description: clean(it.description) ?? clean(it.name), price: price(it.priceMinor) }),
    );
  }
  return { ok: true, json: `${JSON.stringify(site, null, 2)}\n` };
}

function strip(o: Record<string, unknown>) {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}

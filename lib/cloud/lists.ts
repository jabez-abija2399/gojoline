/** Lists (menu items, services) inside site.json, read only: they change through the AI (2026-11-16). */
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

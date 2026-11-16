// Small helpers so a preset reads as content, not brackets.
import { writeFileSync } from "node:fs";
export const t = (en, am) => ({ en, am });
export const img = (name, en, am) => ({ src: `/stock/${name}.webp`, alt: t(en, am) });
export const link = (en, am, href) => ({ label: t(en, am), href });
export const birr = (n) => ({ amountMinor: n * 100, currency: "ETB" });
export const save = (id, site) => writeFileSync(new URL(`../../templates/site/presets/${id}.json`, import.meta.url), compact(site) + "\n");

/**
 * JSON with two-space indents, but small objects of plain values (a text in two languages, a
 * price, a link label) on one line: half the lines, so the builder agent reads and pays for less.
 */
export function compact(value, indent = "") {
  const plain = (v) => v === null || typeof v !== "object";
  if (plain(value)) return JSON.stringify(value);
  const inner = indent + "  ";
  if (Array.isArray(value)) return value.length ? `[\n${value.filter((v) => v !== undefined).map((v) => inner + compact(v, inner)).join(",\n")}\n${indent}]` : "[]";
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (entries.every(([, v]) => plain(v))) return `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(", ")} }`;
  return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${compact(v, inner)}`).join(",\n")}\n${indent}}`;
}

import type { Submission } from "./types";

/** Spreadsheet-safe CSV: quotes everything and neutralises formula injection (=, +, -, @). */
export function toCsv(rows: Submission[]): string {
  const fields = [...new Set(rows.flatMap((r) => Object.keys(r.data)))];
  const cell = (v: string) => {
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const header = ["date", "form", ...fields].map(cell).join(",");
  const lines = rows.map((r) => [r.createdAt.toISOString(), r.formKey, ...fields.map((f) => r.data[f] ?? "")].map(cell).join(","));
  // BOM so Excel opens Amharic text correctly.
  return `﻿${[header, ...lines].join("\r\n")}\r\n`;
}

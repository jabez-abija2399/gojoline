import { z } from "zod";

/**
 * Normalises an Ethiopian mobile number to E.164 (+2519XXXXXXXX or +2517XXXXXXXX).
 * Accepts 09.., 07.., 9.., 2519.., +2519.. with spaces, dashes or dots. Returns null if invalid.
 */
export function normalizeEthiopianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  const match = /^(?:\+?251|0)?([79]\d{8})$/.exec(digits);
  return match ? `+251${match[1]}` : null;
}

const emailSchema = z.email().max(254);

export type Contact = { kind: "phone"; value: string } | { kind: "email"; value: string };

/** Parses "phone or email" input. Emails are lower-cased. */
export function parseContact(input: string): Contact | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    const result = emailSchema.safeParse(trimmed.toLowerCase());
    return result.success ? { kind: "email", value: result.data } : null;
  }
  const phone = normalizeEthiopianPhone(trimmed);
  return phone ? { kind: "phone", value: phone } : null;
}

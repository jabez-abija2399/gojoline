import { z } from "zod";
import { parseContact, type Contact } from "@/lib/contact";

export const waitlistErrorCodes = [
  "nameRequired",
  "contactInvalid",
  "businessTooLong",
  "tooMany",
  "generic",
] as const;
export type WaitlistErrorCode = (typeof waitlistErrorCodes)[number];

const inputSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(80, "nameRequired"),
  contact: z.string().trim().max(254, "contactInvalid"),
  business: z.string().trim().max(80, "businessTooLong").optional().default(""),
  locale: z.enum(["en", "am"]).default("en"),
});

export interface WaitlistEntry {
  name: string;
  contact: Contact;
  business: string | null;
  locale: "en" | "am";
}

export type ParseResult =
  | { ok: true; entry: WaitlistEntry }
  | { ok: false; errors: Partial<Record<"name" | "contact" | "business", WaitlistErrorCode>> };

export function parseWaitlistInput(raw: Record<string, unknown>): ParseResult {
  const result = inputSchema.safeParse(raw);
  const errors: Partial<Record<"name" | "contact" | "business", WaitlistErrorCode>> = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "contact" || field === "business") {
        errors[field] ??= (waitlistErrorCodes as readonly string[]).includes(issue.message)
          ? (issue.message as WaitlistErrorCode)
          : "generic";
      }
    }
    if (!errors.contact && typeof raw.contact === "string" && !parseContact(raw.contact)) {
      errors.contact = "contactInvalid";
    }
    return { ok: false, errors };
  }
  const contact = parseContact(result.data.contact);
  if (!contact) return { ok: false, errors: { contact: "contactInvalid" } };
  return {
    ok: true,
    entry: {
      name: result.data.name,
      contact,
      business: result.data.business || null,
      locale: result.data.locale,
    },
  };
}

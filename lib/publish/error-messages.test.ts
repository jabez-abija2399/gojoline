import { describe, expect, it } from "vitest";
import { getMessages } from "@/lib/i18n";
import type { PublishError } from "./service";

// Every refusal the publish API can give has its own words in both languages: an unknown code
// falls back to "didn't work this time", which hid the plan limit on 2026-11-20.
const CODES: PublishError[] = ["not_found", "no_version", "unverified", "slug_format", "slug_reserved", "slug_taken", "busy", "taken_down", "build_failed", "blocked", "plan_limit", "unfinished", "form_invalid", "paused", "failed"];

describe("publish error messages", () => {
  for (const lang of ["en", "am"] as const) {
    it(`has a message for every publish error (${lang})`, () => {
      const t = getMessages(lang).builder.publishErrors as Record<string, string>;
      for (const code of CODES) expect(t[code], code).toBeTruthy();
    });
  }
});

import { describe, expect, it } from "vitest";
import { am } from "@/lib/i18n/messages/am";
import { en } from "@/lib/i18n/messages/en";

describe("marked example prompts", () => {
  it("are the same words as the prompts the box is filled with", () => {
    for (const t of [en, am]) {
      for (const [id, marked] of Object.entries(t.landing.demo.marked)) {
        expect(marked.replace(/[[\]]/g, "")).toBe(t.landing.demo.prompts[id as keyof typeof t.landing.demo.prompts]);
      }
    }
  });
});

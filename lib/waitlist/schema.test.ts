import { describe, expect, it } from "vitest";
import { parseWaitlistInput } from "./schema";
import { MemoryWaitlistStore } from "./store";

describe("parseWaitlistInput", () => {
  it("accepts a valid entry", () => {
    const result = parseWaitlistInput({ name: " Abebe ", contact: "0911234567", business: "Café", locale: "am" });
    expect(result).toEqual({
      ok: true,
      entry: { name: "Abebe", contact: { kind: "phone", value: "+251911234567" }, business: "Café", locale: "am" },
    });
  });

  it("reports field errors with codes", () => {
    const result = parseWaitlistInput({ name: "", contact: "123", business: "x".repeat(81) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual({ name: "nameRequired", contact: "contactInvalid", business: "businessTooLong" });
    }
  });

  it("treats empty business as null and defaults locale", () => {
    const result = parseWaitlistInput({ name: "A", contact: "a@b.co", business: "" });
    expect(result.ok && result.entry).toMatchObject({ business: null, locale: "en" });
  });

  it("rejects unknown locales", () => {
    expect(parseWaitlistInput({ name: "A", contact: "a@b.co", locale: "fr" }).ok).toBe(false);
  });
});

describe("MemoryWaitlistStore", () => {
  it("is idempotent per contact", async () => {
    const store = new MemoryWaitlistStore();
    const entry = { name: "A", contact: { kind: "email" as const, value: "a@b.co" }, business: null, locale: "en" as const };
    await store.add(entry);
    await store.add({ ...entry, name: "B" });
    expect(await store.count()).toBe(1);
  });
});

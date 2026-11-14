import { describe, expect, it } from "vitest";
import { testDb } from "@/test/db";
import { DbWaitlistStore } from "./db-store";

describe("DbWaitlistStore", () => {
  it("is idempotent per contact", async () => {
    const store = new DbWaitlistStore(await testDb());
    const entry = { name: "A", contact: { kind: "phone" as const, value: "+251911234567" }, business: null, locale: "am" as const };
    await store.add(entry);
    await store.add({ ...entry, name: "B" });
    expect(await store.count()).toBe(1);
  }, 30_000);
});

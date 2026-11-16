import { beforeAll, describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import type { Database } from "@/lib/db/client";
import { DbProjectStore } from "@/lib/projects/db-store";
import { USAGE_MIN_TO_SHOW, countTemplateUsage, templateUsage, usageToShow } from "./template-usage";

let db: Database;
let store: DbProjectStore;

beforeAll(async () => {
  db = await testDb();
  store = new DbProjectStore(db);
  for (const u of ["u1", "u2", "u3"]) await makeUser(db, u);
}, 30_000);

describe("template usage", () => {
  it("counts distinct owners per template and leaves out sites without one", async () => {
    expect(await countTemplateUsage(db)).toEqual({});
    await store.createProject("u1", { name: "", locale: "en", templateId: "cafe" });
    // Trying the same template again does not count twice.
    await store.createProject("u1", { name: "", locale: "en", templateId: "cafe" });
    await store.createProject("u2", { name: "", locale: "am", templateId: "cafe" });
    await store.createProject("u3", { name: "", locale: "en", templateId: "hotel" });
    await store.createProject("u3", { name: "", locale: "en" });
    // A stored id that is no longer a template is ignored.
    await store.createProject("u2", { name: "", locale: "en", templateId: "retired-template" });
    expect(await countTemplateUsage(db)).toEqual({ cafe: 2, hotel: 1 });
    const p = await store.createProject("u2", { name: "", locale: "en", templateId: "salon" });
    expect(p.templateId).toBe("salon");
    expect((await store.getProject("u2", p.id))?.templateId).toBe("salon");
  });

  it("shows a count only from the threshold up, never a made-up one", () => {
    expect(USAGE_MIN_TO_SHOW).toBe(10);
    expect(usageToShow({}, "cafe")).toBeNull();
    expect(usageToShow({ cafe: 9 }, "cafe")).toBeNull();
    expect(usageToShow({ cafe: 10 }, "cafe")).toBe(10);
    expect(usageToShow({ cafe: 250 }, "cafe")).toBe(250);
    expect(usageToShow({ cafe: 250 }, "hotel")).toBeNull();
    expect(usageToShow({ cafe: 3 }, "cafe", 3)).toBe(3);
  });

  it("is empty without a database", async () => {
    if (process.env.DATABASE_URL) return;
    expect(await templateUsage()).toEqual({});
  });
});

import { describe, expect, it } from "vitest";
import { DbProjectStore } from "@/lib/projects/db-store";
import { makeUser, testDb } from "@/test/db";
import { seoEnv } from "./seo";
import { DbSiteSettingsStore, MemorySiteSettingsStore, type SiteSettingsStore } from "./store";

async function stores(): Promise<[string, SiteSettingsStore, string][]> {
  const db = await testDb();
  await makeUser(db, "alice");
  await makeUser(db, "bob");
  const p = await new DbProjectStore(db).createProject("alice", { name: "Selam", locale: "en" });
  return [
    ["db", new DbSiteSettingsStore(db), p.id],
    ["memory", new MemorySiteSettingsStore(), p.id],
  ];
}

describe("site settings stores", () => {
  it("keep business details and the preview per owner; others can't read or overwrite them", async () => {
    for (const [name, store, projectId] of await stores()) {
      await store.saveBusiness("alice", projectId, { phone: "0911223344", announcement: { on: true, text: { en: "Hi" } } });
      await store.saveSeo("alice", projectId, { title: { en: "Selam Café" } });
      expect(await store.get("alice", projectId), name).toEqual({ business: { phone: "0911223344", announcement: { on: true, text: { en: "Hi" } } }, seo: { title: { en: "Selam Café" } } });
      expect(await store.get("bob", projectId), name).toEqual({ business: null, seo: null });
      await expect(store.saveBusiness("bob", projectId, { phone: "0911000000" }), name).rejects.toThrow();
      expect((await store.publicBusiness(projectId))?.phone, name).toBe("0911223344");
    }
  }, 30_000);
});

describe("seoEnv", () => {
  it("passes only what is set, and only photos the site still has", () => {
    expect(seoEnv(null, [])).toBeUndefined();
    expect(seoEnv({ title: { en: "" } }, [])).toBeUndefined();
    expect(JSON.parse(seoEnv({ title: { en: "Selam", am: "ሰላም" }, image: "a.webp", icon: "gone.webp" }, ["a.webp"])!)).toEqual({ title: { en: "Selam", am: "ሰላም" }, image: "/images/a.webp" });
  });
});

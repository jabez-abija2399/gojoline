import { beforeAll, describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import type { Database } from "@/lib/db/client";
import { DbProjectStore } from "./db-store";

let db: Database;
let store: DbProjectStore;

beforeAll(async () => {
  db = await testDb();
  store = new DbProjectStore(db);
  await makeUser(db, "alice");
  await makeUser(db, "bob");
}, 30_000);

describe("DbProjectStore", () => {
  it("creates, lists and renames projects per owner", async () => {
    const p = await store.createProject("alice", { name: "", locale: "am" });
    await store.renameProject("alice", p.id, "Selam Coffee");
    expect((await store.listProjects("alice")).map((x) => x.name)).toContain("Selam Coffee");
    expect(await store.listProjects("bob")).toEqual([]);
  });

  it("numbers versions 1, 2, 3 and returns the latest", async () => {
    const p = await store.createProject("alice", { name: "", locale: "en" });
    for (const n of [1, 2, 3]) await store.addVersion("alice", { projectId: p.id, summary: `v${n}`, files: { "src/site.ts": `v${n}` } });
    expect((await store.listVersions("alice", p.id)).map((v) => v.number)).toEqual([3, 2, 1]);
    expect((await store.latestVersion("alice", p.id))?.files["src/site.ts"]).toBe("v3");
    expect((await store.getVersion("alice", p.id, 2))?.summary).toBe("v2");
  });

  it("keeps messages in order with their status", async () => {
    const p = await store.createProject("alice", { name: "", locale: "en" });
    await store.addMessage("alice", { projectId: p.id, role: "owner", text: "hi" });
    await store.addMessage("alice", { projectId: p.id, role: "assistant", text: "hello", status: "changed", versionNumber: 1 });
    const list = await store.listMessages("alice", p.id);
    expect(list.map((m) => [m.role, m.text, m.status ?? null])).toEqual([["owner", "hi", null], ["assistant", "hello", "changed"]]);
  });

  it("never lets one owner read or change another owner's project", async () => {
    const p = await store.createProject("alice", { name: "Private", locale: "en" });
    await store.addVersion("alice", { projectId: p.id, summary: "v1", files: { "src/site.ts": "secret" } });
    await store.addMessage("alice", { projectId: p.id, role: "owner", text: "secret" });

    expect(await store.getProject("bob", p.id)).toBeNull();
    expect(await store.listMessages("bob", p.id)).toEqual([]);
    expect(await store.listVersions("bob", p.id)).toEqual([]);
    expect(await store.getVersion("bob", p.id, 1)).toBeNull();
    expect(await store.latestVersion("bob", p.id)).toBeNull();
    await expect(store.addMessage("bob", { projectId: p.id, role: "owner", text: "x" })).rejects.toThrow();
    await expect(store.addVersion("bob", { projectId: p.id, summary: "x", files: {} })).rejects.toThrow();
    await store.renameProject("bob", p.id, "Hacked");
    expect((await store.getProject("alice", p.id))?.name).toBe("Private");
  });
});

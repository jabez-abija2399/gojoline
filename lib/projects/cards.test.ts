import { describe, expect, it } from "vitest";
import { MemoryAssetStore } from "@/lib/cloud/assets";
import { MemoryProjectStore } from "./memory-store";
import { cardSource, MemoryCardStore, ownerCards, CARDS_PER_VIEW } from "./cards";

const site = (hero: Record<string, unknown> = {}, theme: Record<string, unknown> = { primary: "#8A4B24", background: "#FBF7F2", text: "#1F1A17" }) =>
  JSON.stringify({ name: { en: "Selam Coffee" }, tagline: { en: "Coffee in Bole" }, theme, pages: [{ path: "/", sections: [{ type: "hero", heading: { en: "Coffee roasted every morning", am: "ቡና" }, ...hero }] }] });

describe("cardSource", () => {
  it("reads the hero headline, the colours and the photo, in the project's language", () => {
    expect(cardSource(site({ image: { src: "/stock/art-card-abstract-blue-violet.webp" } }), "am")).toEqual({
      heading: "ቡና",
      colors: { primary: "#8A4B24", background: "#FBF7F2", text: "#1F1A17" },
      hero: "/stock/art-card-abstract-blue-violet.webp",
    });
  });

  it("ignores photos from anywhere else and colours that aren't plain hex", () => {
    const c = cardSource(site({ image: { src: "https://evil.example/x.webp" } }, { primary: "red", background: "#fff", text: "#000000" }), "en");
    expect(c).toEqual({ heading: "Coffee roasted every morning", colors: null, hero: null });
    expect(cardSource("not json", "en")).toBeNull();
  });
});

describe("ownerCards", () => {
  it("makes cards from the newest version (with the photo), only for the owner, and remakes them when the project changes", async () => {
    const store = new MemoryProjectStore();
    const cards = new MemoryCardStore();
    const deps = { store, assets: new MemoryAssetStore(), cards };
    const p = await store.createProject("ann", { name: "Selam", locale: "en" });
    await store.addVersion("ann", { projectId: p.id, summary: "v1", files: { "src/site.json": site({ image: { src: "/stock/art-card-abstract-blue-violet.webp" } }) } });
    const [proj] = await store.listProjects("ann");
    // A site from before cards existed: none yet, made after the page is sent.
    const first = await ownerCards(deps, "ann", [proj]);
    expect(first.cards.size).toBe(0);
    await first.fill();
    const card = (await ownerCards(deps, "ann", [proj])).cards.get(p.id)!;
    expect(card.versionNumber).toBe(1);
    expect(card.thumbKey).toMatch(/^[0-9a-f]{32}$/);
    expect((await cards.thumb("ann", p.id))?.data.length).toBeGreaterThan(100);
    // Another owner gets nothing, even by asking for the id.
    expect((await cards.forOwner("bob", [p.id])).size).toBe(0);
    expect(await cards.thumb("bob", p.id)).toBeNull();

    // A new version without a photo: the card follows the newest version number.
    await store.addVersion("ann", { projectId: p.id, summary: "v2", files: { "src/site.json": site() } });
    await (await ownerCards(deps, "ann", [proj])).fill();
    const again = (await ownerCards(deps, "ann", [proj])).cards.get(p.id)!;
    expect(again.versionNumber).toBe(2);
    expect(again.thumbKey).toBeNull();
    expect(again.colors?.primary).toBe("#8A4B24");
  });

  it("an unreadable site still gets a card (no retry on every view) until its next version", async () => {
    const store = new MemoryProjectStore();
    const deps = { store, cards: new MemoryCardStore() };
    const p = await store.createProject("ann", { name: "Broken", locale: "en" });
    await store.addVersion("ann", { projectId: p.id, summary: "v1", files: { "src/site.json": "{oops" } });
    await (await ownerCards(deps, "ann", [p])).fill();
    const again = await ownerCards(deps, "ann", [p]);
    expect(again.cards.get(p.id)).toMatchObject({ versionNumber: 1, thumbKey: null, colors: null });
  });

  it("makes at most a few cards per view and skips projects without a version", async () => {
    const store = new MemoryProjectStore();
    const deps = { store, cards: new MemoryCardStore() };
    const made = [];
    for (let i = 0; i < CARDS_PER_VIEW + 2; i++) {
      const p = await store.createProject("ann", { name: `S${i}`, locale: "en" });
      await store.addVersion("ann", { projectId: p.id, summary: "v1", files: { "src/site.json": site() } });
      made.push(p);
    }
    const empty = await store.createProject("ann", { name: "Empty", locale: "en" });
    const list = await store.listProjects("ann");
    await (await ownerCards(deps, "ann", list)).fill();
    expect((await ownerCards(deps, "ann", list)).cards.size).toBe(CARDS_PER_VIEW);
    await (await ownerCards(deps, "ann", list)).fill();
    const all = (await ownerCards(deps, "ann", list)).cards;
    expect(all.size).toBe(made.length);
    expect(all.has(empty.id)).toBe(false);
  });
});

describe("DbCardStore", () => {
  it("keeps one card per project and never lets another owner replace or read it", async () => {
    const { makeUser, testDb } = await import("@/test/db");
    const { DbProjectStore } = await import("./db-store");
    const { DbCardStore } = await import("./cards");
    const db = await testDb();
    await makeUser(db, "ann");
    await makeUser(db, "bob");
    const store = new DbProjectStore(db);
    const cards = new DbCardStore(db);
    const p = await store.createProject("ann", { name: "Selam", locale: "en" });
    await cards.save("ann", { projectId: p.id, versionNumber: 1, heading: "Hello", colors: null, thumbKey: "k1" }, Buffer.from("one"));
    await cards.save("bob", { projectId: p.id, versionNumber: 9, heading: "Hacked", colors: null, thumbKey: "k2" }, Buffer.from("two"));
    expect((await cards.forOwner("ann", [p.id])).get(p.id)).toMatchObject({ versionNumber: 1, heading: "Hello", thumbKey: "k1" });
    expect(Buffer.from((await cards.thumb("ann", p.id))!.data).toString()).toBe("one");
    expect(await cards.thumb("bob", p.id)).toBeNull();
    // Nor can another owner claim a project that has no card yet.
    const q = await store.createProject("ann", { name: "Second", locale: "en" });
    await cards.save("bob", { projectId: q.id, versionNumber: 1, heading: "Mine now", colors: null, thumbKey: "k3" }, Buffer.from("three"));
    await cards.save("ann", { projectId: q.id, versionNumber: 1, heading: "Ann's", colors: null, thumbKey: "k4" }, Buffer.from("four"));
    expect((await cards.forOwner("ann", [q.id])).get(q.id)?.heading).toBe("Ann's");
    await cards.save("ann", { projectId: p.id, versionNumber: 2, heading: "New", colors: { primary: "#111111", background: "#ffffff", text: "#000000" }, thumbKey: null }, null);
    expect((await cards.forOwner("ann", [p.id])).get(p.id)).toMatchObject({ versionNumber: 2, colors: { primary: "#111111" }, thumbKey: null });
  }, 30_000);
});

import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeUser, testDb } from "@/test/db";
import type { Database } from "@/lib/db/client";
import { sites, user } from "@/lib/db/schema";
import { DbProjectStore } from "@/lib/projects/db-store";
import { USAGE_MIN_TO_SHOW, countTemplateUsage, templateUsage, usageToShow, withTimeout } from "./template-usage";

let db: Database;
let store: DbProjectStore;
let slugs = 0;

/** A user with a real verified email, a verified phone, or nothing verified. */
async function owner(id: string, how: "email" | "phone" | "none" | "phone-placeholder") {
  await makeUser(db, id);
  if (how === "email") await db.update(user).set({ emailVerified: true }).where(eq(user.id, id));
  if (how === "phone") await db.update(user).set({ phoneNumberVerified: true, email: `${id}@phone.gojoline.invalid` }).where(eq(user.id, id));
  // The placeholder address of a phone account is "verified" by Better Auth but is not a real email.
  if (how === "phone-placeholder") await db.update(user).set({ emailVerified: true, email: `${id}@phone.gojoline.invalid` }).where(eq(user.id, id));
}

/** A project from a template, with a site in the given state (or none). */
async function site(ownerId: string, templateId: string | null, status: "published" | "pending" | "taken_down" | null) {
  const p = await store.createProject(ownerId, { name: "", locale: "en", templateId });
  if (status) await db.insert(sites).values({ projectId: p.id, ownerId, slug: `site-${++slugs}`, provider: "memory", status });
  return p;
}

beforeAll(async () => {
  db = await testDb();
  store = new DbProjectStore(db);
  await owner("mail", "email");
  await owner("phone", "phone");
  await owner("fresh", "none");
  await owner("fake", "phone-placeholder");
}, 30_000);

describe("template usage", () => {
  it("counts verified owners with a live site, once each", async () => {
    expect(await countTemplateUsage(db)).toEqual({});
    await site("mail", "cafe", "published");
    // The same owner again does not count twice.
    await site("mail", "cafe", "published");
    await site("phone", "cafe", "published");
    await site("phone", "hotel", "published");
    // Not counted: no template, an id that is no longer a template.
    await site("mail", null, "published");
    await site("mail", "retired-template", "published");
    expect(await countTemplateUsage(db)).toEqual({ cafe: 2, hotel: 1 });
  });

  it("does not count unverified owners", async () => {
    await site("fresh", "salon", "published");
    await site("fake", "salon", "published");
    expect((await countTemplateUsage(db)).salon).toBeUndefined();
  });

  it("does not count sites that are not live", async () => {
    await site("mail", "school", null);
    await site("mail", "school", "pending");
    await site("phone", "school", "taken_down");
    expect((await countTemplateUsage(db)).school).toBeUndefined();
  });

  it("stores the template on the project", async () => {
    const p = await store.createProject("mail", { name: "", locale: "en", templateId: "salon" });
    expect(p.templateId).toBe("salon");
    expect((await store.getProject("mail", p.id))?.templateId).toBe("salon");
    expect((await store.createProject("mail", { name: "", locale: "en" })).templateId).toBeNull();
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

  it("gives up on a slow count instead of holding the page", async () => {
    const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 200));
    expect(await withTimeout(slow, 20, 0)).toEqual({ value: 0, timedOut: true });
    expect(await withTimeout(Promise.resolve(5), 20, 0)).toEqual({ value: 5, timedOut: false });
    // A failure after the timeout is not left unhandled.
    const late = new Promise<number>((_, reject) => setTimeout(() => reject(new Error("late")), 30));
    expect(await withTimeout(late, 5, 0)).toEqual({ value: 0, timedOut: true });
    await new Promise((r) => setTimeout(r, 40));
  });

  it("is empty without a database", async () => {
    if (process.env.DATABASE_URL) return;
    expect(await templateUsage()).toEqual({});
  });
});

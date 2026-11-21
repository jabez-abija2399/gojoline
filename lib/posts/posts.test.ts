import { describe, expect, it } from "vitest";
import { MemoryTelegramClient } from "@/lib/telegram/client";
import { MemoryStorageProvider } from "@/lib/providers/storage/memory";
import { cleanHashtags, PlainCaptionWriter, type CaptionWriter } from "./captions";
import { isDigestTime, weeklyDigest } from "./digest";
import { addDays, planDays, postText, trackedLink, type PlanContext } from "./plan";
import { addisNow, planAhead, publishPost, runDue, type PostDeps } from "./service";
import { MemoryPostStore } from "./store";
import type { AnalyticsReport } from "@/lib/analytics/report";

const ctx: PlanContext = { templates: [{ id: "cafe", name: "Bole Buna House" }, { id: "hotel", name: "Lake Tana Lodge" }], sites: [] };

function deps(over: Partial<PostDeps> = {}): PostDeps & { tg: MemoryTelegramClient } {
  const tg = new MemoryTelegramClient();
  return {
    store: new MemoryPostStore(),
    captions: new PlainCaptionWriter(),
    telegram: { client: tg, channelId: "@gojoline" },
    appUrl: "https://gojoline.afridea.et",
    context: async () => ctx,
    media: async (m) => (m ? { kind: "photo", data: Buffer.from("jpg"), name: "x.jpg" } : null),
    files: new MemoryStorageProvider(),
    tg,
    ...over,
  };
}

describe("planDays", () => {
  // 2026-11-23 is a Monday.
  const base = { from: "2026-11-23", days: 7, taken: new Set<string>(), recent: [] as string[], ctx, channels: ["telegram" as const] };

  it("follows the week's rhythm, rotating templates, with a template when no site opted in", () => {
    const plan = planDays(base);
    expect(plan.map((p) => p.kind)).toEqual(["template", "tip", "template", "feature", "template", "idea", "tip"]);
    expect(plan.filter((p) => p.kind === "template").map((p) => p.subject)).toEqual(["cafe", "hotel", "cafe"]);
    expect(plan[0].media).toEqual({ type: "template", id: "cafe" });
    // Two tips in a week are different tips.
    const tips = plan.filter((p) => p.kind === "tip").map((p) => p.subject);
    expect(new Set(tips).size).toBe(2);
  });

  it("uses an opted-in site on Wednesdays, skips days that have a post, and avoids recent subjects", () => {
    const plan = planDays({ ...base, taken: new Set(["2026-11-24"]), recent: ["cafe"], ctx: { ...ctx, sites: [{ siteId: "s1", name: "Selam", url: "https://selam.example" }] } });
    expect(plan.map((p) => p.day)).not.toContain("2026-11-24");
    expect(plan.find((p) => p.day === "2026-11-25")).toMatchObject({ kind: "site", subject: "s1", media: { type: "site", siteId: "s1" } });
    expect(plan[0].subject).toBe("hotel");
  });
});

describe("links and text", () => {
  it("tags each network's link for Admin → Analytics", () => {
    expect(trackedLink("https://gojoline.afridea.et", "telegram", "2026-11-23")).toBe("https://gojoline.afridea.et/en?utm_source=telegram&utm_medium=social&utm_campaign=post-2026-11-23");
    expect(trackedLink("https://gojoline.afridea.et", "instagram", "2026-11-23")).toContain("utm_source=facebook");
    const text = postText({ captionAm: "ሰላም", captionEn: "Hello", hashtags: "#Gojoline", day: "2026-11-23" }, "tiktok", "https://g.example");
    expect(text).toBe("ሰላም\n\nHello\n\nhttps://g.example/en?utm_source=tiktok&utm_medium=social&utm_campaign=post-2026-11-23\n\n#Gojoline");
  });

  it("keeps hashtags tidy and always includes #Gojoline", () => {
    expect(cleanHashtags("#Ethiopia, #website  <b>#addis</b> nonsense")).toBe("#Gojoline #Ethiopia #website #addis");
    expect(cleanHashtags("#ኢትዮጵያ #Gojoline")).toBe("#ኢትዮጵያ #Gojoline");
  });
});

describe("planAhead and publishing", () => {
  it("plans and captions the empty days, then a second plan adds nothing", async () => {
    const d = deps();
    expect(await planAhead(d, "admin", "2026-11-23")).toBe(7);
    const posts = await d.store.between("2026-11-23", "2026-11-29");
    expect(posts.every((p) => p.status === "draft" && p.captionEn.includes("Start free") && p.captionAm.length > 0 && p.channels.includes("telegram"))).toBe(true);
    expect(await planAhead(d, "admin", "2026-11-23")).toBe(0);
  });

  it("falls back to a plain caption when the AI fails", async () => {
    const failing: CaptionWriter = { write: async () => Promise.reject(new Error("down")) };
    const d = deps({ captions: failing });
    await planAhead(d, "admin", "2026-11-23", 1);
    const [p] = await d.store.between("2026-11-23", "2026-11-23");
    expect(p.captionEn).toContain("Start free");
  });

  it("sends approved posts to Telegram with the picture, once, and saves the result", async () => {
    const d = deps();
    await planAhead(d, "admin", "2026-11-23", 1);
    const [p] = await d.store.between("2026-11-23", "2026-11-23");
    // A draft is never sent.
    await publishPost(d, p.id);
    expect(d.tg.posts).toHaveLength(0);
    await d.store.update(p.id, { status: "approved" });
    const after = await publishPost(d, p.id);
    expect(after?.status).toBe("posted");
    expect(after?.results.telegram).toMatchObject({ ok: true, ref: "1" });
    expect(d.tg.posts[0]).toMatchObject({ chatId: "@gojoline", media: { kind: "photo", name: "x.jpg" } });
    expect(d.tg.posts[0].html).toContain("utm_source=telegram");
    await publishPost(d, p.id);
    expect(d.tg.posts).toHaveLength(1);
  });

  it("saves a failure (no channel set) and runs only what is due at its Addis time", async () => {
    const d = deps({ telegram: null });
    await planAhead(d, "admin", "2026-11-23", 2);
    const [a, b] = await d.store.between("2026-11-23", "2026-11-24");
    await d.store.update(a.id, { status: "approved", channels: ["telegram"] });
    await d.store.update(b.id, { status: "approved", channels: ["telegram"] });
    // 18:00 Addis on the 23rd = 15:00 UTC: post a is due at 18:30, not yet.
    expect(await runDue(d, Date.parse("2026-11-23T15:00:00Z"))).toEqual({ sent: 0, failed: 0 });
    const r = await runDue(d, Date.parse("2026-11-23T15:45:00Z"));
    expect(r).toEqual({ sent: 0, failed: 1 });
    expect((await d.store.get(a.id))?.status).toBe("failed");
    expect((await d.store.get(a.id))?.results.telegram?.error).toContain("TELEGRAM_CHANNEL_ID");
    expect((await d.store.get(b.id))?.status).toBe("approved");
  });

  it("knows Addis time and the Monday summary window", () => {
    expect(addisNow(Date.parse("2026-11-23T21:30:00Z"))).toEqual({ day: "2026-11-24", time: "00:30" });
    expect(isDigestTime("2026-11-23", "09:05")).toBe(true);
    expect(isDigestTime("2026-11-23", "09:15")).toBe(false);
    expect(isDigestTime("2026-11-24", "09:05")).toBe(false);
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});

describe("weeklyDigest", () => {
  it("shows last week's numbers with the change from the week before", () => {
    const series = (vals: number[]) => vals.map((value, i) => ({ day: `2026-11-${10 + i}`, value }));
    const report = {
      period: "week",
      buckets: [],
      series: { signups: series([3, 5, 1]), sitesStarted: series([2, 2, 0]), published: series([1, 0, 0]), payments: series([0, 2, 0]), revenue: series([0, 99800, 0]), visits: series([40, 25, 3]) },
      funnel: { signedUp: 0, started: 0, published: 0, paid: 0 },
      clicks: [],
      templates: [],
      sources: [{ source: "telegram", n: 2 }],
    } as unknown as AnalyticsReport;
    const text = weeklyDigest(report, []);
    expect(text).toContain("Sign-ups: <b>5</b> (▲ 2)");
    expect(text).toContain("Sites published: <b>0</b> (▼ 1)");
    expect(text).toContain("Revenue: <b>998 Birr</b>");
    expect(text).toContain("Sites started: <b>2</b>\n");
    expect(text).toContain("telegram 2");
  });
});

describe("DbPostStore", () => {
  it("stores posts, lists them by day, and marks them sent or failed from the results", async () => {
    const { testDb } = await import("@/test/db");
    const { DbPostStore } = await import("./store");
    const store = new DbPostStore(await testDb());
    const [a, b] = await store.createMany([
      { day: "2026-11-24", time: "18:30", kind: "tip", subject: "tip-photos", captionEn: "Hi", captionAm: "ሰላም", hashtags: "#Gojoline", media: null, channels: ["telegram"] },
      { day: "2026-11-23", time: "09:00", kind: "template", subject: "cafe", captionEn: "Hi", captionAm: "ሰላም", hashtags: "#Gojoline", media: { type: "template", id: "cafe" }, channels: ["telegram"] },
    ]);
    expect((await store.between("2026-11-23", "2026-11-24")).map((p) => p.id)).toEqual([b.id, a.id]);
    expect(b.media).toEqual({ type: "template", id: "cafe" });
    await store.update(a.id, { status: "approved" });
    expect((await store.due("2026-11-24")).map((p) => p.id)).toEqual([a.id]);
    const failed = await store.saveResult(a.id, "telegram", { ok: false, at: new Date().toISOString(), error: "nope" });
    expect(failed?.status).toBe("failed");
    const sent = await store.saveResult(a.id, "telegram", { ok: true, at: new Date().toISOString(), ref: "7" });
    expect(sent).toMatchObject({ status: "posted", results: { telegram: { ok: true, ref: "7" } } });
    expect(sent?.postedAt).toBeInstanceOf(Date);
    expect((await store.history(5)).map((p) => p.id)).toEqual([a.id]);
  }, 30_000);
});

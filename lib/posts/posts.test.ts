import { describe, expect, it } from "vitest";
import { MemoryTelegramClient } from "@/lib/telegram/client";
import { TelegramPublisher } from "./publishers";
import { MemoryStorageProvider } from "@/lib/providers/storage/memory";
import { MemoryLock } from "@/lib/lock";
import { cleanHashtags, PlainCaptionWriter, type CaptionWriter } from "./captions";
import { isDigestTime, weeklyDigest } from "./digest";
import { addDays, planDays, postText, trackedLink, youtubeTitle, type PlanContext } from "./plan";
import { addisNow, makeVideo, planAhead, publishPost, runDue, type PostDeps } from "./service";
import { FakeVideoRenderer, type VideoRenderer } from "./video";
import { MemoryPostStore } from "./store";
import type { AnalyticsReport } from "@/lib/analytics/report";

const ctx: PlanContext = { templates: [{ id: "cafe", name: "Bole Buna House" }, { id: "hotel", name: "Lake Tana Lodge" }], sites: [] };

function deps(over: Partial<PostDeps> = {}): PostDeps & { tg: MemoryTelegramClient } {
  const tg = new MemoryTelegramClient();
  return {
    store: new MemoryPostStore(),
    captions: new PlainCaptionWriter(),
    publishers: async () => ({ telegram: new TelegramPublisher(tg, "@gojoline") }),
    mediaUrl: (id) => `https://gojoline.afridea.et/api/public/post-media/${id}?exp=1&sig=x`,
    appUrl: "https://gojoline.afridea.et",
    context: async () => ctx,
    media: async (m) => (m ? { kind: "photo", data: Buffer.from("jpg"), name: "x.jpg" } : null),
    files: new MemoryStorageProvider(),
    lock: new MemoryLock(),
    video: null,
    tg,
    ...over,
  };
}

describe("planDays", () => {
  // 2026-11-23 is a Monday.
  const base = { from: "2026-11-23", days: 7, taken: new Set<string>(), recent: [] as string[], ctx, channels: ["telegram" as const] };

  it("alternates two weekly rhythms of demos, templates, help and conversation, rotating subjects", () => {
    const plan = planDays({ ...base, days: 14 });
    expect(plan.map((p) => p.kind)).toEqual(["demo", "tip", "template", "myth", "template", "question", "idea", "template", "howto", "template", "feature", "demo", "question", "story"]);
    // A demo shows the sentence that built its template; templates rotate.
    expect(plan[0]).toMatchObject({ subject: "cafe", media: { type: "template", id: "cafe" } });
    expect(plan.filter((p) => p.kind === "template").map((p) => p.subject)).toEqual(["cafe", "hotel", "cafe", "hotel"]);
    expect(plan.find((p) => p.kind === "myth")?.subject).toMatch(/^myth-/);
    expect(plan.find((p) => p.kind === "question")?.subject).toMatch(/^q-/);
  });

  it("a holiday takes its day, on the right date in an Ethiopian leap year", () => {
    const plan = planDays({ ...base, from: "2027-01-04", days: 7 });
    expect(plan.find((p) => p.day === "2027-01-07")).toMatchObject({ kind: "moment", subject: "moment-genna", media: null });
    // 2019 E.C. is a leap year: New Year falls on 12 September 2027, Meskel on the 28th.
    const sept = planDays({ ...base, from: "2027-09-10", days: 20 });
    expect(sept.find((p) => p.kind === "moment" && p.subject === "moment-new-year")?.day).toBe("2027-09-12");
    expect(sept.find((p) => p.kind === "moment" && p.subject === "moment-meskel")?.day).toBe("2027-09-28");
    expect(sept.find((p) => p.day === "2027-09-11")?.kind).not.toBe("moment");
  });

  it("uses an opted-in site on Wednesdays, skips days that have a post, and avoids recent subjects", () => {
    const plan = planDays({ ...base, taken: new Set(["2026-11-24"]), recent: ["cafe"], ctx: { ...ctx, sites: [{ siteId: "s1", name: "Selam", url: "https://selam.example" }] } });
    expect(plan.map((p) => p.day)).not.toContain("2026-11-24");
    expect(plan.find((p) => p.day === "2026-11-25")).toMatchObject({ kind: "site", subject: "s1", media: { type: "site", siteId: "s1" } });
    // "cafe" was posted recently: the next template is another one.
    expect(plan.find((p) => p.kind === "template")?.subject).toBe("hotel");
  });
});

describe("links and text", () => {
  it("tags each network's link for Admin → Analytics", () => {
    expect(trackedLink("https://gojoline.afridea.et", "telegram", "2026-11-23")).toBe("https://gojoline.afridea.et/en?utm_source=telegram&utm_medium=social&utm_campaign=post-2026-11-23");
    expect(trackedLink("https://gojoline.afridea.et", "instagram", "2026-11-23")).toContain("utm_source=facebook");
    const text = postText({ captionEn: "Hello", hashtags: "#Gojoline", day: "2026-11-23" }, "telegram", "https://g.example");
    expect(text).toBe("Hello\n\nhttps://g.example/en?utm_source=telegram&utm_medium=social&utm_campaign=post-2026-11-23\n\n#Gojoline");
    // TikTok and Instagram: no link in the caption (it can't be tapped), at most 5 hashtags.
    const tt = postText({ captionEn: "Hello", hashtags: "#Gojoline #a #b #c #d #e #f", day: "2026-11-23" }, "tiktok", "https://g.example");
    expect(tt).toBe("Hello\n\nLink in bio: start free, pay in Birr.\n\n#Gojoline #a #b #c #d");
    expect(youtubeTitle({ captionEn: "A website in one minute\n\nMore words" })).toBe("A website in one minute #Shorts");
    expect(youtubeTitle({ captionEn: "x ".repeat(80) }).length).toBeLessThanOrEqual(100);
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
    // English only: every caption is reviewed by an admin.
    expect(posts.every((p) => p.status === "draft" && p.captionAm === "" && p.channels.includes("telegram"))).toBe(true);
    // A call to action, except where a question or a greeting should have the last word.
    expect(posts.filter((p) => p.kind !== "question" && p.kind !== "moment").every((p) => p.captionEn.includes("Start free"))).toBe(true);
    expect(posts.find((p) => p.kind === "question")?.captionEn).toMatch(/\?$/);
    expect(await planAhead(d, "admin", "2026-11-23")).toBe(0);
  });

  it("text-only days skip the networks that need a picture or video", async () => {
    const fake = { channel: "instagram" as const, label: "x", publish: async () => "1" };
    const d = deps({ publishers: async () => ({ telegram: new TelegramPublisher(new MemoryTelegramClient(), "@g"), instagram: fake, tiktok: { ...fake, channel: "tiktok" as const } }) });
    await planAhead(d, "admin", "2026-11-23");
    const posts = await d.store.between("2026-11-23", "2026-11-29");
    expect(posts.find((p) => p.kind === "tip")?.channels).toEqual(["telegram"]);
    expect(posts.find((p) => p.kind === "template")?.channels).toEqual(["telegram", "instagram", "tiktok"]);
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
    const d = deps({ publishers: async () => ({}) });
    await planAhead(d, "admin", "2026-11-23", 2);
    const [a, b] = await d.store.between("2026-11-23", "2026-11-24");
    await d.store.update(a.id, { status: "approved", channels: ["telegram"] });
    await d.store.update(b.id, { status: "approved", channels: ["telegram"] });
    // 18:00 Addis on the 23rd = 15:00 UTC: post a is due at 18:30, not yet.
    expect(await runDue(d, Date.parse("2026-11-23T15:00:00Z"))).toEqual({ sent: 0, failed: 0 });
    const r = await runDue(d, Date.parse("2026-11-23T15:45:00Z"));
    expect(r).toEqual({ sent: 0, failed: 1 });
    expect((await d.store.get(a.id))?.status).toBe("failed");
    expect((await d.store.get(a.id))?.results.telegram?.error).toContain("not connected");
    expect((await d.store.get(b.id))?.status).toBe("approved");
  });

  it("never sends a site of the week whose owner stopped showing it, and never sends a post twice at once", async () => {
    let sites = [{ siteId: "s1", name: "Selam", url: "https://selam.example" }];
    const d = deps({ context: async () => ({ ...ctx, sites }) });
    const [p] = await d.store.createMany([{ day: "2026-11-25", time: "18:30", kind: "site", subject: "s1", captionEn: "Site of the week: Selam", captionAm: "ሰላም", hashtags: "#Gojoline", media: { type: "site", siteId: "s1" }, channels: ["telegram"] }]);
    await d.store.update(p.id, { status: "approved" });
    sites = [];
    const after = await publishPost(d, p.id);
    expect(d.tg.posts).toHaveLength(0);
    expect(after).toMatchObject({ status: "failed", results: { telegram: { ok: false, error: "site no longer in the showcase" } } });

    // Two sends at the same moment: one message.
    sites = [{ siteId: "s1", name: "Selam", url: "https://selam.example" }];
    const [q] = await d.store.createMany([{ day: "2026-11-25", time: "18:30", kind: "tip", subject: "tip-photos", captionEn: "Hi there", captionAm: "ሰላም", hashtags: "#Gojoline", media: null, channels: ["telegram"] }]);
    await d.store.update(q.id, { status: "approved" });
    await Promise.all([publishPost(d, q.id), publishPost(d, q.id)]);
    expect(d.tg.posts).toHaveLength(1);
  });

  it("an approved post with no automatic network fails once instead of staying due", async () => {
    const d = deps();
    const [p] = await d.store.createMany([{ day: "2026-11-23", time: "09:00", kind: "tip", subject: "tip-photos", captionEn: "Hi there", captionAm: "ሰላም", hashtags: "#Gojoline", media: null, channels: [] }]);
    await d.store.update(p.id, { status: "approved" });
    await runDue(d, Date.parse("2026-11-23T08:00:00Z"));
    expect((await d.store.get(p.id))?.status).toBe("failed");
    expect(await d.store.due("2026-11-23")).toHaveLength(0);
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

describe("post videos", () => {
  it("films a template's demo in the chosen language, keeps the video with the post, and Telegram sends it", async () => {
    const video = new FakeVideoRenderer();
    const d = deps({ video, media: async (m) => (m?.type === "video" ? { kind: "video", data: (await d.files.get(m.key))!, name: "v.mp4" } : null) });
    const [p] = await d.store.createMany([{ day: "2026-11-23", time: "18:30", kind: "template", subject: "cafe", captionEn: "Hi there", captionAm: "ሰላም", hashtags: "#Gojoline", media: { type: "template", id: "cafe" }, channels: ["telegram"] }]);
    const after = await makeVideo(d, p.id, "tour", "am");
    expect(after?.media).toEqual({ type: "video", key: `posts/${p.id}-tour-am.mp4` });
    expect(video.requests[0]).toMatchObject({ url: "https://gojoline.afridea.et/demo/cafe/am/", style: "template", lang: "am", text: { kicker: "የዕለቱ አብነት", footer: "gojoline.afridea.et" } });
    expect((await d.files.get(`posts/${p.id}-tour-am.mp4`))?.length).toBe(2000);
    await d.store.update(p.id, { status: "approved" });
    await publishPost(d, p.id);
    expect(d.tg.posts[0].media).toMatchObject({ kind: "video" });
  });

  it("films a site only while it is in the showcase, and makes a text video for a tip", async () => {
    let sites = [{ siteId: "s1", name: "Selam", url: "https://selam.gojoline.site/" }];
    const video = new FakeVideoRenderer();
    const d = deps({ video, context: async () => ({ ...ctx, sites }) });
    const [site, tip] = await d.store.createMany([
      { day: "2026-11-25", time: "18:30", kind: "site", subject: "s1", captionEn: "Site", captionAm: "ሰላም", hashtags: "", media: { type: "site", siteId: "s1" }, channels: ["telegram"] },
      { day: "2026-11-26", time: "18:30", kind: "tip", subject: "tip-photos", captionEn: "Tip", captionAm: "ምክር", hashtags: "", media: null, channels: ["telegram"] },
    ]);
    expect((await makeVideo(d, site.id, "spotlight", "en"))?.media?.type).toBe("video");
    expect(video.requests[0]).toMatchObject({ url: "https://selam.gojoline.site/", style: "spotlight", text: { kicker: "Site of the week", title: "Selam" } });
    // A tip has no page: it becomes a text video from its own words.
    expect((await makeVideo(d, tip.id, "tour", "en"))?.media).toEqual({ type: "video", key: `posts/${tip.id}-story-en.mp4` });
    expect(video.stories[0]).toMatchObject({ lang: "en", kicker: "Website tip", title: "Tip", cta: "Comment your business" });
    sites = [];
    expect(await makeVideo(d, site.id, "tour", "en")).toBeNull();
  });

  it("a holiday gets its greeting video (picture, title and line from the library) and keeps Instagram and TikTok", async () => {
    const video = new FakeVideoRenderer();
    const fake = { channel: "instagram" as const, label: "x", publish: async () => "1" };
    const d = deps({ video, publishers: async () => ({ telegram: new TelegramPublisher(new MemoryTelegramClient(), "@g"), instagram: fake }) });
    // 27 Sep 2026 is Meskel.
    await planAhead(d, "admin", "2026-09-27", 1);
    const [meskel] = await d.store.between("2026-09-27", "2026-09-27");
    expect(meskel).toMatchObject({ kind: "moment", subject: "moment-meskel", media: null, channels: ["telegram", "instagram"] });
    // The timed run two days before makes its video.
    expect(await runDue(d, Date.parse("2026-09-25T07:00:00Z"))).toMatchObject({ videos: 1 });
    expect(video.greetings[0]).toEqual({ lang: "en", motif: "meskel", text: { kicker: "From all of us at Gojoline", title: "Melkam Meskel!", sub: "Wishing everyone a bright and peaceful Meskel.", footer: "gojoline.afridea.et" } });
    expect((await d.store.get(meskel.id))?.media).toEqual({ type: "video", key: `posts/${meskel.id}-greeting-en.mp4` });
    // Without a renderer, a holiday is text only: no Instagram.
    const e = deps({ publishers: d.publishers });
    await planAhead(e, "admin", "2026-09-27", 1);
    expect((await e.store.between("2026-09-27", "2026-09-27"))[0].channels).toEqual(["telegram"]);
  });

  it("a post without media is not sent to networks that need it, and says why", async () => {
    let calls = 0;
    const fake = { channel: "instagram" as const, label: "x", publish: async () => String(++calls) };
    const d = deps({ publishers: async () => ({ telegram: new TelegramPublisher(new MemoryTelegramClient(), "@g"), instagram: fake }) });
    const [p] = await d.store.createMany([{ day: "2026-09-27", time: "09:00", kind: "moment", subject: "moment-meskel", captionEn: "Melkam Meskel!", captionAm: "", hashtags: "", media: null, channels: ["telegram", "instagram"] }]);
    await d.store.update(p.id, { status: "approved" });
    const after = await publishPost(d, p.id);
    expect(after?.results.telegram?.ok).toBe(true);
    expect(after?.results.instagram).toMatchObject({ ok: false, error: "needs a picture or video" });
    expect(calls).toBe(0);
  });

  it("the timed run makes the next draft's video (seen before approval), never changes an approved post, and remembers a failure", async () => {
    const failing: VideoRenderer = { render: async () => Promise.reject(new Error("renderer 502")), greeting: async () => Promise.reject(new Error("renderer 502")), story: async () => Promise.reject(new Error("renderer 502")) };
    const d = deps({ video: new FakeVideoRenderer() });
    const [approved, draft] = await d.store.createMany([
      { day: "2026-11-24", time: "18:30", kind: "template", subject: "cafe", captionEn: "Hi there", captionAm: "ሰላም", hashtags: "", media: { type: "template", id: "cafe" }, channels: ["telegram"] },
      { day: "2026-11-25", time: "18:30", kind: "template", subject: "hotel", captionEn: "Hi there", captionAm: "ሰላም", hashtags: "", media: { type: "template", id: "hotel" }, channels: ["telegram"] },
    ]);
    await d.store.update(approved.id, { status: "approved" });
    // 23 Nov, 10:00 Addis: the draft due in two days gets its video; the approved post keeps its picture.
    expect(await runDue(d, Date.parse("2026-11-23T07:00:00Z"))).toMatchObject({ videos: 1, sent: 0 });
    expect((await d.store.get(draft.id))?.media?.type).toBe("video");
    expect((await d.store.get(approved.id))?.media?.type).toBe("template");

    const e = deps({ video: failing });
    const [q] = await e.store.createMany([{ day: "2026-11-24", time: "18:30", kind: "template", subject: "hotel", captionEn: "Hi there", captionAm: "ሰላም", hashtags: "", media: { type: "template", id: "hotel" }, channels: ["telegram"] }]);
    await runDue(e, Date.parse("2026-11-23T07:00:00Z"));
    const after = await e.store.get(q.id);
    expect(after?.results.video).toMatchObject({ ok: false, error: "renderer 502" });
    expect(after?.status).toBe("draft");
    expect(after?.media?.type).toBe("template");
    // Not retried every 15 minutes.
    expect(await runDue(e, Date.parse("2026-11-23T07:15:00Z"))).not.toHaveProperty("videos");
  });
});

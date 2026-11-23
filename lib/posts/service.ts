import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { CaptionWriter } from "./captions";
import { addDays, planDays, postFacts, postText, type PlanContext } from "./plan";
import type { PostStore } from "./store";
import { CHANNELS, type Channel, type ChannelResult, type PostMedia, type SocialPost } from "./types";
import type { StorageProvider } from "@/lib/providers/storage/types";
import type { VideoRenderer, VideoStyle } from "./video";
import type { ChannelPublisher, MediaFile } from "./publishers";
import type { ConnectionStore } from "./connections";
import type { ConnectionVerifier } from "./verify";
import { getMessages } from "@/lib/i18n";
import { MOMENTS } from "./library";
import { STORY_KINDS, storyFor } from "./story";

/** The networks Gojoline can post to by itself once connected (YouTube uses the posting kit). */
export const AUTO_CHANNELS: readonly Channel[] = ["telegram", "facebook", "instagram", "tiktok"];

/** Networks that take only a picture or video (no text-only posts), and those that take only video. */
const NEEDS_MEDIA: readonly Channel[] = ["instagram", "tiktok"];

export type { MediaFile };

/** One post at a time: a double click, or "Post now" during the timed run, never posts twice. */
export interface PostLock {
  acquire(key: string, ttlMs: number): Promise<string | null>;
  release(key: string, token: string): Promise<void>;
}

export interface PostDeps {
  store: PostStore;
  captions: CaptionWriter;
  /** The networks that are connected (Telegram channel, Facebook Page, Instagram, TikTok inbox). */
  publishers(): Promise<Partial<Record<Channel, ChannelPublisher>>>;
  /** A short-lived public address of a post's media (for networks that fetch it); null when not possible. */
  mediaUrl(postId: string): string | null;
  /** Gojoline's own accounts, connected from Admin (tokens sealed); null in unit tests. */
  connections?: ConnectionStore;
  /** Checks a Facebook or Instagram connection before it is saved. */
  verify?: ConnectionVerifier;
  appUrl: string;
  /** What posts can be about, read fresh (templates; sites whose owners opted in). */
  context(): Promise<PlanContext>;
  /** A post's picture or video as bytes. */
  media(media: PostMedia): Promise<MediaFile | null>;
  /** Where rendered videos are kept (posts/<id>.mp4). */
  files: StorageProvider;
  lock: PostLock;
  /** Films pages into post videos; null when the renderer isn't set up. */
  video: VideoRenderer | null;
}

/** Which automatic networks are ready (connected), for planning and the admin page. */
export async function readyChannels(deps: Pick<PostDeps, "publishers">): Promise<Channel[]> {
  const p = await deps.publishers();
  return AUTO_CHANNELS.filter((c) => !!p[c]);
}

/** Draft posts, with captions, for each of the next `days` days (from `today`) that has none. */
export async function planAhead(deps: PostDeps, adminId: string, today: string, days = 7): Promise<number> {
  // One plan at a time (a double click or two admins): no duplicate days, no paying twice for captions.
  const token = await deps.lock.acquire("posts:plan", 120_000);
  if (!token) return 0;
  try {
    return await planLocked(deps, adminId, today, days);
  } finally {
    await deps.lock.release("posts:plan", token);
  }
}

async function planLocked(deps: PostDeps, adminId: string, today: string, days: number): Promise<number> {
  const [existing, recentPosts, ctx] = await Promise.all([deps.store.between(today, addDays(today, days - 1)), deps.store.between(addDays(today, -60), addDays(today, -1)), deps.context()]);
  const taken = new Set(existing.filter((p) => p.status !== "skipped").map((p) => p.day));
  const recent = recentPosts.map((p) => p.subject).filter((s): s is string => !!s);
  const ready = await readyChannels(deps);
  // Text-only days skip the networks that need a picture or video (holidays get a greeting video when the renderer is set up).
  const filmed = (d: { media: unknown; kind: SocialPost["kind"] }) => !!d.media || (FILMABLE.includes(d.kind) && !!deps.video);
  const drafts = planDays({ from: today, days, taken, recent, ctx, channels: ready }).map((d) => (filmed(d) ? d : { ...d, channels: d.channels.filter((c) => !NEEDS_MEDIA.includes(c)) }));
  const written = await Promise.all(drafts.map(async (d) => ({ ...d, ...(await caption(deps, adminId, d, ctx)) })));
  return (await deps.store.createMany(written)).length;
}

async function caption(deps: PostDeps, adminId: string, post: Pick<SocialPost, "kind" | "subject">, ctx: PlanContext) {
  const facts = postFacts(post, ctx);
  try {
    return await deps.captions.write(facts, { adminId, kind: post.kind });
  } catch {
    // The AI failed: a plain caption the admin can edit, rather than no post.
    const { PlainCaptionWriter } = await import("./captions");
    return new PlainCaptionWriter().write(facts, { kind: post.kind });
  }
}

/** Writes the caption again (the admin didn't like it). */
export async function rewriteCaption(deps: PostDeps, adminId: string, id: string) {
  const post = await deps.store.get(id);
  if (!post || post.status === "posted") return null;
  return deps.store.update(id, await caption(deps, adminId, post, await deps.context()));
}

/**
 * Sends a post to each automatic network it names that hasn't taken it yet, saving each result.
 * Never throws: a network's failure is saved as its result.
 */
export async function publishPost(deps: PostDeps, id: string): Promise<SocialPost | null> {
  const key = `post:${id}`;
  const token = await deps.lock.acquire(key, 5 * 60_000);
  if (!token) return deps.store.get(id);
  try {
    return await publishLocked(deps, id);
  } finally {
    await deps.lock.release(key, token);
  }
}

async function publishLocked(deps: PostDeps, id: string): Promise<SocialPost | null> {
  // Read again under the lock: another run may have just sent it.
  let post = await deps.store.get(id);
  if (!post || post.status === "skipped" || post.status === "draft") return post;
  const pending = post.channels.filter((c) => AUTO_CHANNELS.includes(c) && !post!.results[c]?.ok);
  if (pending.length === 0) {
    // Approved but nowhere to send it by itself (no automatic network ticked): not due forever.
    if (post.status === "approved" && !Object.values(post.results).some((r) => r?.ok)) return deps.store.update(id, { status: "failed" });
    return post;
  }
  // A site of the week only while its owner still shows it (opt-out, takedown or hide since planning).
  if (post.kind === "site") {
    const listed = (await deps.context()).sites.some((s) => s.siteId === post!.subject);
    if (!listed) {
      for (const channel of pending) post = (await deps.store.saveResult(id, channel, { ok: false, at: new Date().toISOString(), error: "site no longer in the showcase" })) ?? post;
      return post;
    }
  }
  const media = await deps.media(post.media).catch(() => null);
  for (const channel of pending) {
    // A holiday post whose greeting video couldn't be made: networks that need media say so plainly.
    if (!media && NEEDS_MEDIA.includes(channel)) {
      post = (await deps.store.saveResult(id, channel, { ok: false, at: new Date().toISOString(), error: "needs a picture or video" })) ?? post;
      continue;
    }
    const result: ChannelResult = await sendTo(deps, channel, post, media).then(
      (ref) => ({ ok: true, at: new Date().toISOString(), ref }),
      (e: unknown) => ({ ok: false, at: new Date().toISOString(), error: e instanceof Error ? e.message.slice(0, 300) : "failed" }),
    );
    post = (await deps.store.saveResult(id, channel, result)) ?? post;
  }
  return post;
}

async function sendTo(deps: PostDeps, channel: Channel, post: SocialPost, media: MediaFile | null): Promise<string> {
  const publisher = (await deps.publishers())[channel];
  if (!publisher) throw new Error(`${channel} not connected (${CONNECT_HINT[channel]})`);
  return publisher.publish({ text: postText(post, channel, deps.appUrl), media, mediaUrl: media && NEEDS_MEDIA.includes(channel) ? deps.mediaUrl(post.id) : null });
}

/** What connects each network (server settings), for the error saved on a post. */
export const CONNECT_HINT: Record<Channel, string> = {
  telegram: "Admin → Posts → Connections",
  facebook: "Admin → Posts → Connections",
  instagram: "Admin → Posts → Connections",
  tiktok: "Admin → Posts → Connections",
  youtube: "posting kit",
};


/**
 * Films the post's template demo or opted-in site into a video, or has its card drawn (a holiday
 * greeting, or a text video for a tip, myth, how-to…), keeps it as the post's media
 * (posts/<id>-<style>-<lang>.mp4) and returns the post. Every kind of post can have a video.
 */
export async function makeVideo(deps: PostDeps, id: string, style: VideoStyle, lang: "en" | "am"): Promise<SocialPost | null> {
  if (!deps.video) throw new Error("video renderer not set up (RENDERER_URL)");
  const post = await deps.store.get(id);
  // A custom post has no subject: its own words make the text video.
  if (!post || post.status === "posted" || (!post.subject && post.kind !== "custom")) return null;
  const ctx = await deps.context();
  // What the video says, in its language (the renderer only draws it).
  const words = getMessages(lang).admin.posts.videoText;
  let url: string;
  let title: string;
  if (post.kind === "template" || post.kind === "demo") {
    const t = ctx.templates.find((x) => x.id === post.subject);
    if (!t) return null;
    url = `${deps.appUrl}/demo/${t.id}/${lang === "am" ? "am/" : ""}`;
    title = (lang === "am" ? t.nameAm : t.name) ?? t.name;
  } else if (post.kind === "site") {
    // Only while the owner still shows it in the showcase.
    const s = ctx.sites.find((x) => x.siteId === post.subject);
    if (!s) return null;
    url = s.url;
    title = s.name;
  } else if (STORY_KINDS.includes(post.kind)) {
    // A tip, myth, how-to, question…: a text video made from the post's own words.
    const st = storyFor(post);
    if (!st) return null;
    // Text videos are written in English (their words come from the English library and caption).
    const data = await deps.video.story({ lang: "en", ...st, footer: new URL(deps.appUrl).host });
    const key = `posts/${post.id}-story-${lang}.mp4`;
    await deps.files.put(key, data, { contentType: "video/mp4" });
    return keepVideo(deps, id, key);
  } else if (post.kind === "moment") {
    // A holiday: the renderer draws the greeting card (no page to film).
    const m = MOMENTS.find((x) => x.id === post.subject);
    if (!m) return null;
    const data = await deps.video.greeting({ lang, motif: m.motif, text: { kicker: words.greeting, title: lang === "am" ? m.titleAm : m.title, sub: lang === "am" ? m.subAm : m.sub, footer: new URL(deps.appUrl).host } });
    const key = `posts/${post.id}-greeting-${lang}.mp4`;
    await deps.files.put(key, data, { contentType: "video/mp4" });
    return keepVideo(deps, id, key);
  } else return null;
  const footer = new URL(deps.appUrl).host;
  const kicker = post.kind === "site" ? words.site : post.kind === "demo" ? words.demo : words.template;
  const data = await deps.video.render({ url, style: post.kind !== "site" && style === "tour" ? "template" : style, lang, text: { kicker, title, outroTitle: words.outroTitle, outroSub: words.outroSub, site: title, footer } });
  const key = `posts/${post.id}-${style}-${lang}.mp4`;
  await deps.files.put(key, data, { contentType: "video/mp4" });
  return keepVideo(deps, id, key);
}

/** Makes the video the post's media and clears an earlier failure note (the video works now). */
export async function keepVideo(deps: PostDeps, id: string, key: string): Promise<SocialPost | null> {
  await deps.store.update(id, { media: { type: "video", key } });
  return deps.store.saveResult(id, "video", { ok: true, at: new Date().toISOString() });
}

/** Posts that can have a video: a template or site filmed, a holiday's greeting card, or a text video. */
export const FILMABLE: SocialPost["kind"][] = ["template", "demo", "site", "moment", ...STORY_KINDS];

/** Addis Ababa "now" as day and HH:MM. */
export function addisNow(now: number): { day: string; time: string } {
  const iso = new Date(now + 3 * 3_600_000).toISOString();
  return { day: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** Today in Addis Ababa (YYYY-MM-DD). */
export const addisToday = () => addisNow(Date.now()).day;

/** The timed run (every 15 minutes): sends approved posts whose day and time have come. */
export async function runDue(deps: PostDeps, now: number): Promise<{ sent: number; failed: number; videos?: number }> {
  const { day, time } = addisNow(now);
  // Posts whose time has come go first: a video can wait, a 09:00 post can't.
  const due = (await deps.store.due(day)).filter((p) => p.day < day || p.time <= time);
  let sent = 0;
  let failed = 0;
  for (const p of due) {
    const after = await publishPost(deps, p.id);
    if (after?.status === "posted") sent++;
    else failed++;
  }
  // Then one video (they take a minute): for the next draft template, site or holiday post of the coming
  // two days, so the admin sees the video before approving it. Approved posts keep what was approved.
  let videos = 0;
  if (deps.video) {
    const soon = (await deps.store.between(day, addDays(day, 2))).find((p) => p.status === "draft" && FILMABLE.includes(p.kind) && p.media?.type !== "video" && !p.results.video);
    if (soon) {
      await makeVideo(deps, soon.id, "tour", "en").then(
        () => videos++,
        // Remembered so the run doesn't retry it every 15 minutes; the picture is used instead.
        (e: unknown) => deps.store.saveResult(soon.id, "video", { ok: false, at: new Date(now).toISOString(), error: e instanceof Error ? e.message.slice(0, 200) : "failed" }),
      );
    }
  }
  return { sent, failed, ...(videos ? { videos } : {}) };
}

/** A template's screenshot as it is stored (WebP), for the admin's preview: no re-encoding. */
export async function templatePreview(id: string): Promise<Buffer | null> {
  if (!/^[a-z-]+$/.test(id)) return null;
  return readFile(join(process.cwd(), "public", "showcase", `${id}-en-top.webp`)).catch(() => null);
}

const jpegs = new Map<string, Buffer>();

/** A template's phone screenshot (from the landing page's showcase shots), as JPEG for the networks (made once per template). */
export async function templatePicture(id: string): Promise<MediaFile | null> {
  if (!/^[a-z-]+$/.test(id)) return null;
  let data = jpegs.get(id);
  if (!data) {
    const file = await readFile(join(process.cwd(), "public", "showcase", `${id}-en-top.webp`)).catch(() => null);
    if (!file) return null;
    data = await sharp(file).jpeg({ quality: 85 }).toBuffer();
    jpegs.set(id, data);
  }
  return { kind: "photo", data, name: `${id}.jpg` };
}

export { CHANNELS };

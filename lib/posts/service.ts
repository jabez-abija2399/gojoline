import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { TelegramClient } from "@/lib/telegram/client";
import { escapeHtml } from "@/lib/telegram/client";
import type { CaptionWriter } from "./captions";
import { addDays, planDays, postFacts, postText, type PlanContext } from "./plan";
import type { PostStore } from "./store";
import { CHANNELS, type Channel, type ChannelResult, type PostMedia, type SocialPost } from "./types";
import type { StorageProvider } from "@/lib/providers/storage/types";

/** The networks Gojoline can post to by itself today (the others get the posting kit). */
export const AUTO_CHANNELS: readonly Channel[] = ["telegram"];

export type MediaFile = { kind: "photo" | "video"; data: Buffer; name: string };

export interface PostDeps {
  store: PostStore;
  captions: CaptionWriter;
  /** Our Telegram channel (TELEGRAM_CHANNEL_ID, e.g. @gojoline) through the bot; null when not set. */
  telegram: { client: TelegramClient; channelId: string } | null;
  appUrl: string;
  /** What posts can be about, read fresh (templates; sites whose owners opted in). */
  context(): Promise<PlanContext>;
  /** A post's picture or video as bytes. */
  media(media: PostMedia): Promise<MediaFile | null>;
  /** Where rendered videos are kept (posts/<id>.mp4). */
  files: StorageProvider;
}

/** Which automatic networks are ready (configured), for the admin page. */
export function readyChannels(deps: Pick<PostDeps, "telegram">): Channel[] {
  return deps.telegram ? ["telegram"] : [];
}

/** Draft posts, with captions, for each of the next `days` days (from `today`) that has none. */
export async function planAhead(deps: PostDeps, adminId: string, today: string, days = 7): Promise<number> {
  const [existing, recentPosts, ctx] = await Promise.all([deps.store.between(today, addDays(today, days - 1)), deps.store.between(addDays(today, -60), addDays(today, -1)), deps.context()]);
  const taken = new Set(existing.filter((p) => p.status !== "skipped").map((p) => p.day));
  const recent = recentPosts.map((p) => p.subject).filter((s): s is string => !!s);
  const drafts = planDays({ from: today, days, taken, recent, ctx, channels: [...readyChannels(deps)] });
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
    return new PlainCaptionWriter().write(facts);
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
  let post = await deps.store.get(id);
  if (!post || post.status === "skipped" || post.status === "draft") return post;
  const pending = post.channels.filter((c) => AUTO_CHANNELS.includes(c) && !post!.results[c]?.ok);
  if (pending.length === 0) return post;
  const media = await deps.media(post.media).catch(() => null);
  for (const channel of pending) {
    const result: ChannelResult = await sendTo(deps, channel, post, media).then(
      (ref) => ({ ok: true, at: new Date().toISOString(), ref }),
      (e: unknown) => ({ ok: false, at: new Date().toISOString(), error: e instanceof Error ? e.message.slice(0, 300) : "failed" }),
    );
    post = (await deps.store.saveResult(id, channel, result)) ?? post;
  }
  return post;
}

async function sendTo(deps: PostDeps, channel: Channel, post: SocialPost, media: MediaFile | null): Promise<string> {
  if (channel === "telegram") {
    if (!deps.telegram) throw new Error("Telegram channel not set (TELEGRAM_CHANNEL_ID)");
    return deps.telegram.client.post(deps.telegram.channelId, { html: escapeHtml(postText(post, "telegram", deps.appUrl)), media });
  }
  throw new Error(`${channel}: not connected yet`);
}

/** Addis Ababa "now" as day and HH:MM. */
export function addisNow(now: number): { day: string; time: string } {
  const iso = new Date(now + 3 * 3_600_000).toISOString();
  return { day: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** Today in Addis Ababa (YYYY-MM-DD). */
export const addisToday = () => addisNow(Date.now()).day;

/** The timed run (every 15 minutes): sends approved posts whose day and time have come. */
export async function runDue(deps: PostDeps, now: number): Promise<{ sent: number; failed: number }> {
  const { day, time } = addisNow(now);
  const due = (await deps.store.due(day)).filter((p) => p.day < day || p.time <= time);
  let sent = 0;
  let failed = 0;
  for (const p of due) {
    const after = await publishPost(deps, p.id);
    if (after?.status === "posted") sent++;
    else failed++;
  }
  return { sent, failed };
}

/** A template's phone screenshot (from the landing page's showcase shots) as JPEG for the networks. */
export async function templatePicture(id: string): Promise<MediaFile | null> {
  if (!/^[a-z-]+$/.test(id)) return null;
  const file = await readFile(join(process.cwd(), "public", "showcase", `${id}-en-top.webp`)).catch(() => null);
  if (!file) return null;
  const data = await sharp(file).jpeg({ quality: 85 }).toBuffer();
  return { kind: "photo", data, name: `${id}.jpg` };
}

export { CHANNELS };

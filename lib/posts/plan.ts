import { DEMO_PROMPTS, LIBRARY, libraryItem, momentOn } from "./library";
import { DEFAULT_TIME, type Channel, type NewPost, type PostKind, type SocialPost } from "./types";

/** What a post can be about: our templates and the live sites whose owners opted in. */
export interface PlanContext {
  templates: { id: string; name: string; nameAm?: string }[];
  sites: { siteId: string; name: string; url: string }[];
}

/**
 * Two weeks that alternate (Monday first). Each has two videos (a demo or a template), one site of
 * the week (a template while no owner has opted in), and useful or conversational posts between:
 * tips and how-tos, a myth, a question, an idea or a feature, the story behind Gojoline. Help first,
 * selling second; a holiday takes its day.
 */
const WEEKS: PostKind[][] = [
  ["demo", "tip", "site", "myth", "template", "question", "idea"],
  ["template", "howto", "site", "feature", "demo", "question", "story"],
];

const DAY = 86_400_000;
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
/** 0 = Monday. */
const weekday = (day: string) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
/** Which of the two weeks a day is in (counting Mondays since 2026-01-05). */
const weekOf = (day: string) => Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse("2026-01-05T00:00:00Z")) / (7 * DAY)) % 2 === 0 ? 0 : 1;

/** The first of `items` not used recently, else the least recently used one. */
function next<T>(items: T[], key: (x: T) => string, recent: string[]): T | null {
  if (items.length === 0) return null;
  const fresh = items.find((x) => !recent.includes(key(x)));
  if (fresh) return fresh;
  return [...items].sort((a, b) => recent.lastIndexOf(key(a)) - recent.lastIndexOf(key(b)))[0];
}

export type PlannedPost = Omit<NewPost, "captionEn" | "captionAm" | "hashtags">;

/**
 * Draft posts for the days in [from, from + days) that have none yet. `recent` lists the subjects
 * of recent posts, oldest first, so subjects rotate instead of repeating.
 */
export function planDays(input: { from: string; days: number; taken: Set<string>; recent: string[]; ctx: PlanContext; channels: Channel[] }): PlannedPost[] {
  const out: PlannedPost[] = [];
  const recent = [...input.recent];
  for (let i = 0; i < input.days; i++) {
    const day = addDays(input.from, i);
    if (input.taken.has(day)) continue;
    const moment = momentOn(day);
    let kind: PostKind = moment ? "moment" : WEEKS[weekOf(day)][weekday(day)];
    if (kind === "site" && input.ctx.sites.length === 0) kind = "template";
    let subject: string | null = moment?.id ?? null;
    let media: NewPost["media"] = null;
    if (kind === "demo") {
      // A template that has the sentence that built it.
      const t = next(input.ctx.templates.filter((x) => DEMO_PROMPTS[x.id]), (x) => `demo:${x.id}`, recent);
      if (t) {
        subject = t.id;
        media = { type: "template", id: t.id };
        recent.push(`demo:${t.id}`);
      } else kind = "template";
    }
    if (kind === "template") {
      const t = next(input.ctx.templates, (x) => x.id, recent);
      if (!t) kind = "tip";
      else {
        subject = t.id;
        media = { type: "template", id: t.id };
      }
    } else if (kind === "site") {
      const s = next(input.ctx.sites, (x) => x.siteId, recent)!;
      subject = s.siteId;
      media = { type: "site", siteId: s.siteId };
    }
    if (kind in LIBRARY) subject = next([...LIBRARY[kind as keyof typeof LIBRARY]], (x) => x.id, recent)?.id ?? null;
    if (subject && kind !== "demo") recent.push(subject);
    out.push({ day, time: DEFAULT_TIME, kind, subject, media, channels: input.channels });
  }
  return out;
}

/** The facts a caption is written from (English). */
export function postFacts(post: Pick<SocialPost, "kind" | "subject">, ctx: PlanContext): string {
  // True whether the post ends up with a picture or a video (videos are made after planning).
  const shows = "Have a look at the real website.";
  if (post.kind === "template") {
    const t = ctx.templates.find((x) => x.id === post.subject);
    return `A ready-made website design: "${t?.name ?? "Gojoline template"}". Start from it, then change anything by chatting. ${shows}`;
  }
  if (post.kind === "demo") {
    const prompt = post.subject ? DEMO_PROMPTS[post.subject] : undefined;
    return prompt ? `Type one message, like "${prompt}", and Gojoline builds a website like this one in about a minute. Then change anything by chatting.` : "Type one message, and Gojoline builds your website in about a minute.";
  }
  if (post.kind === "site") {
    const s = ctx.sites.find((x) => x.siteId === post.subject);
    return `Site of the week: ${s?.name ?? "a website"}, built with Gojoline by its owner. ${shows}`;
  }
  return libraryItem(post.subject)?.en ?? "Build your website by chatting, in Amharic or English.";
}

export const DEFAULT_HASHTAGS = "#Gojoline #Ethiopia #AddisAbaba #SmallBusiness #website";

/** A plain caption without the AI (no key, or the AI failed): the facts and the call to action. */
export function plainCaption(facts: string, kind?: string): { captionEn: string; captionAm: string; hashtags: string } {
  // A question ends with its question, a holiday with the greeting: no sales line after them.
  const cta = kind === "question" || kind === "moment" ? "" : "\n\nStart free, pay in Birr.";
  return { captionEn: `${facts}${cta}`, captionAm: "", hashtags: DEFAULT_HASHTAGS };
}

/** A link that tells Admin → Analytics which network and which post brought a visitor. */
export function trackedLink(appUrl: string, channel: Channel, day: string, lang: "en" | "am" = "en"): string {
  const source = channel === "instagram" ? "facebook" : channel === "youtube" ? "other" : channel;
  const u = new URL(`/${lang}`, appUrl);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", `post-${day}`);
  return u.toString();
}

/** The full text for one network: the caption, the tracked link and the hashtags. */
export function postText(post: Pick<SocialPost, "captionEn" | "hashtags" | "day">, channel: Channel, appUrl: string): string {
  // TikTok and Instagram don't make links in captions tappable: point to the profile's link instead,
  // and keep hashtags to the few those networks reward.
  if (channel === "tiktok" || channel === "instagram") {
    const tags = post.hashtags.trim().split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
    return [post.captionEn.trim(), "Link in bio: start free, pay in Birr.", tags].filter(Boolean).join("\n\n");
  }
  return [post.captionEn.trim(), trackedLink(appUrl, channel, post.day), post.hashtags.trim()].filter(Boolean).join("\n\n");
}

/** A YouTube Shorts title: the caption's hook, at most 100 characters, with #Shorts. */
export function youtubeTitle(post: Pick<SocialPost, "captionEn">): string {
  const hook = post.captionEn.trim().split("\n")[0].trim();
  const room = 100 - " #Shorts".length;
  const short = hook.length > room ? `${hook.slice(0, room - 1).replace(/\s+\S*$/, "")}…` : hook;
  return `${short} #Shorts`;
}

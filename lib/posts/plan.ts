import { LIBRARY, libraryItem } from "./library";
import { DEFAULT_TIME, type Channel, type NewPost, type PostKind, type SocialPost } from "./types";

/** What a post can be about: our templates and the live sites whose owners opted in. */
export interface PlanContext {
  templates: { id: string; name: string }[];
  sites: { siteId: string; name: string; url: string }[];
}

/**
 * The week's rhythm (Monday first): templates twice, a site of the week (a template when no owner
 * has opted in yet), tips twice, a feature and an idea. Varied, and never more selling than help.
 */
const WEEK: PostKind[] = ["template", "tip", "site", "feature", "template", "idea", "tip"];

const DAY = 86_400_000;
export const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
/** 0 = Monday. */
const weekday = (day: string) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;

/** The first of `items` not used recently, else the least recently used one. */
function next<T>(items: T[], key: (x: T) => string, recent: string[]): T | null {
  if (items.length === 0) return null;
  const fresh = items.find((x) => !recent.includes(key(x)));
  if (fresh) return fresh;
  return [...items].sort((a, b) => recent.lastIndexOf(key(a)) - recent.lastIndexOf(key(b)))[0];
}

/**
 * Draft posts for the days in [from, from + days) that have none yet. `recent` lists the subjects
 * of recent posts, oldest first, so subjects rotate instead of repeating.
 */
export function planDays(input: { from: string; days: number; taken: Set<string>; recent: string[]; ctx: PlanContext; channels: Channel[] }): (Omit<NewPost, "captionEn" | "captionAm" | "hashtags">)[] {
  const out: (Omit<NewPost, "captionEn" | "captionAm" | "hashtags">)[] = [];
  const recent = [...input.recent];
  for (let i = 0; i < input.days; i++) {
    const day = addDays(input.from, i);
    if (input.taken.has(day)) continue;
    let kind = WEEK[weekday(day)];
    if (kind === "site" && input.ctx.sites.length === 0) kind = "template";
    let subject: string | null = null;
    let media: NewPost["media"] = null;
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
    if (kind === "tip" || kind === "feature" || kind === "idea") subject = next(LIBRARY[kind], (x) => x.id, recent)?.id ?? null;
    if (subject) recent.push(subject);
    out.push({ day, time: DEFAULT_TIME, kind, subject, media, channels: input.channels });
  }
  return out;
}

/** The facts a caption is written from (English; the AI writes both languages from them). */
export function postFacts(post: Pick<SocialPost, "kind" | "subject">, ctx: PlanContext): { en: string; am: string } {
  if (post.kind === "template") {
    const t = ctx.templates.find((x) => x.id === post.subject);
    return { en: `A ready-made design: "${t?.name ?? "Gojoline template"}". Start from it, then change anything by chatting.`, am: `የተዘጋጀ ዲዛይን፦ «${t?.name ?? "የጎጆላይን ቴምፕሌት"}»። ከሱ ይጀምሩ፣ ከዚያ ማንኛውንም ነገር በመጻፍ ይቀይሩ።` };
  }
  if (post.kind === "site") {
    const s = ctx.sites.find((x) => x.siteId === post.subject);
    return { en: `Site of the week: ${s?.name ?? "a site"}, built with Gojoline by its owner.`, am: `የሳምንቱ ድረ-ገጽ፦ ${s?.name ?? "ድረ-ገጽ"}፣ ባለቤቱ በጎጆላይን የሠራው።` };
  }
  const item = libraryItem(post.subject);
  return item ? { en: item.en, am: item.am } : { en: "Build your website by chatting, in Amharic or English.", am: "ድረ-ገጽዎን በመጻፍ ይሥሩ፣ በአማርኛ ወይም በእንግሊዝኛ።" };
}

export const DEFAULT_HASHTAGS = "#Gojoline #Ethiopia #AddisAbaba #website";

/** A plain caption without the AI (no key, or the AI failed): the facts and the call to action. */
export function plainCaption(facts: { en: string; am: string }): { captionEn: string; captionAm: string; hashtags: string } {
  return { captionEn: `${facts.en}\n\nStart free, pay in Birr.`, captionAm: `${facts.am}\n\nበነጻ ይጀምሩ፣ በብር ይክፈሉ።`, hashtags: DEFAULT_HASHTAGS };
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

/** The full text for one network: both languages, the tracked link and the hashtags. */
export function postText(post: Pick<SocialPost, "captionEn" | "captionAm" | "hashtags" | "day">, channel: Channel, appUrl: string): string {
  return [post.captionAm.trim(), post.captionEn.trim(), trackedLink(appUrl, channel, post.day), post.hashtags.trim()].filter(Boolean).join("\n\n");
}

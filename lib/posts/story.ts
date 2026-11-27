import { libraryItem } from "./library";
import type { PostKind, SocialPost } from "./types";

/**
 * A text video for a post with no page to film (a tip, myth, how-to, question, feature, idea,
 * story or a custom post, 2026-11-22): the hook on top from the first frame, then up to four
 * short lines taken from the post's facts, then one ask. English only, like every post.
 */
export interface StoryText {
  kicker: string;
  title: string;
  lines: string[];
  cta: string;
}

const KICKER: Partial<Record<PostKind, string>> = {
  tip: "Website tip",
  howto: "How to",
  myth: "Myth vs fact",
  question: "Quick question",
  feature: "Gojoline feature",
  idea: "Website idea",
  story: "Our story",
  custom: "Gojoline",
};

/** Kinds that become text videos (template, demo and site posts are filmed; holidays get a greeting). */
export const STORY_KINDS: PostKind[] = Object.keys(KICKER) as PostKind[];

// The renderer's fonts have no emoji: they are dropped, with any space they leave doubled.
const clean = (s: string) =>
  s
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

function cap(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trim()}…`;
}

const upper = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const tidy = (s: string) => upper(clean(s).replace(/[.;,]+$/, ""));

/** Splits facts into short lines: "Myth:… Fact:…", numbered steps, a list after a colon, or sentences. */
export function factLines(text: string): string[] {
  const t = clean(text);
  if (/\bFact:/.test(t)) return t.split(/\s+(?=Fact:)/).map(tidy);
  if (/\d\)/.test(t)) return t.slice(t.indexOf(":") + 1).split(/,?\s*(?:and\s+)?\d\)\s*/).map(tidy).filter(Boolean);
  const colon = t.indexOf(":");
  if (colon > 0 && colon < 60 && /,/.test(t.slice(colon))) {
    return t
      .slice(colon + 1)
      .split(/,\s*(?:and\s+)?|\s+and\s+(?![^(]*\))/)
      .map(tidy)
      .filter(Boolean);
  }
  return t.split(/(?<=[.!?])\s+/).map(tidy).filter(Boolean);
}

/** The words for a post's text video, or null for kinds that are filmed or greeted instead. */
export function storyFor(post: Pick<SocialPost, "kind" | "subject" | "captionEn">): StoryText | null {
  const kicker = KICKER[post.kind];
  if (!kicker) return null;
  const facts = libraryItem(post.subject)?.en ?? "";
  const caption = clean(post.captionEn);
  // The caption's first line is its hook (the caption writer puts it there).
  const hook = clean(post.captionEn.split("\n")[0] ?? "");
  let lines = factLines(facts || caption.slice(hook.length));
  const title = hook || lines[0] || "Gojoline";
  // Don't repeat the hook as a line.
  lines = lines.filter((l) => l.toLowerCase() !== title.toLowerCase().replace(/[.!?]+$/, ""));
  if (lines.length === 0) lines = factLines(caption).filter((l) => !title.startsWith(l)).slice(0, 3);
  if (lines.length === 0) lines = ["Describe your business in one message", "Gojoline builds your website in about a minute"];
  return {
    kicker,
    title: cap(title, 90),
    lines: lines.slice(0, 4).map((l) => cap(l, 110)),
    cta: post.kind === "question" ? "Answer in the comments" : "Comment your business",
  };
}

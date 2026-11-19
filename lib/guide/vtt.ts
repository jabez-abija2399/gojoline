/**
 * The guide video's WebVTT files (captions and chapters, English and Amharic), made from the
 * chapter list and the messages. Written to public/guide/ by scripts/guide-assets.mts; a unit
 * test checks the committed files still match.
 */
import { GUIDE_SECTIONS, trackSrc } from "./sections.ts";
import { CAPTION_SETTINGS, CAPTION_TIMES, CHAPTERS_TXT, VIDEO_SECONDS, captionCues, chapterCues, parseChapters, toVtt, type Chapter } from "./video.ts";

type GuideText = {
  video: { captions: readonly string[]; intro: string; closing: string };
  sections: Record<(typeof GUIDE_SECTIONS)[number], { title: string }>;
};

/** "2. Describe your business": a chapter's title in the guide's language. */
export function chapterTitle(c: Chapter, g: GuideText): string {
  if (c.n === null) return c.start === 0 ? g.video.intro : g.video.closing;
  const id = GUIDE_SECTIONS[c.n - 1];
  return id ? `${c.n}. ${g.sections[id].title}` : `${c.n}. ${c.title}`;
}

/** Public URL path (like /guide/captions-en.vtt) → file content. */
export function vttFiles(texts: { en: GuideText; am: GuideText }): Record<string, string> {
  const chapters = parseChapters(CHAPTERS_TXT);
  const out: Record<string, string> = {};
  for (const lang of ["en", "am"] as const) {
    const g = texts[lang];
    out[trackSrc("chapters", lang)] = toVtt(chapterCues(chapters, VIDEO_SECONDS, (c) => chapterTitle(c, g)));
    out[trackSrc("captions", lang)] = toVtt(captionCues(CAPTION_TIMES, g.video.captions, CAPTION_SETTINGS));
  }
  return out;
}

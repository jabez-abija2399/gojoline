/**
 * The "How to use Gojoline" video (2026-11-19): its chapters, its on-screen captions and the
 * WebVTT files made from them. Pure functions with no imports, so `scripts/guide-assets.mts`
 * can run this file directly with Node's type stripping.
 */

/** The video's chapter list as the editor wrote it (m:ss, then the title). */
export const CHAPTERS_TXT = `0:00  Intro
0:03  1. Start
0:17.53  2. Describe your business
0:31.97  3. Watch it build
0:53.50  4. Look around
1:33.33  5. Change anything by chatting
3:01.52  6. Your photos
3:25.52  7. Versions
3:53.52  8. Publish
4:10.52  9. Your site dashboard
5:04.52  10. Plan and payments
5:35.52  Closing
`;

/** Length of public/guide/gojoline-guide-720.mp4, in seconds, and its size in bytes (Lalibela Sky Lodge in steps 2-5, pointer and music, 2026-11-20). */
export const VIDEO_SECONDS = 339.87;
export const VIDEO_BYTES = 12753391;

/**
 * The English captions are burned into the picture near the bottom; a captions track turned on
 * in the player shows near the top so the two never cover each other.
 */
export const CAPTION_SETTINGS = "line:6%";

/**
 * When each English caption burned into the video shows (start, end in seconds), in the same
 * order as `guide.video.captions` in the messages. Taken from the video's edit list.
 */
export const CAPTION_TIMES: readonly (readonly [number, number])[] = [
  [4.8, 12.1],
  [12.1, 14.8],
  [14.8, 17.5],
  [19.33, 28.06],
  [28.06, 31.94],
  [33.8, 49.96],
  [49.96, 53.46],
  [55.3, 75.83],
  [75.83, 93.33],
  [95.13, 110.09],
  [110.09, 113.23],
  [113.23, 132.68],
  [132.68, 155.43],
  [155.43, 178.03],
  [183.37, 194.87],
  [194.87, 198.8],
  [198.8, 205.9],
  [207.7, 226.1],
  [226.1, 234.45],
  [236.25, 240.75],
  [240.75, 244.85],
  [244.85, 250.95],
  [252.75, 260.95],
  [260.95, 270.55],
  [270.55, 281.45],
  [281.45, 286.65],
  [286.65, 300.95],
  [300.95, 304.75],
  [306.55, 318.95],
  [318.95, 329.05],
  [329.05, 331.65],
  [331.65, 336.65],
];

export interface Chapter {
  /** Seconds from the start. */
  start: number;
  /** 1 to 10 for the guide's sections; null for the intro and the closing. */
  n: number | null;
  /** The title as written in the list, without its number. */
  title: string;
}

/** "1:20" → 80, "0:03" → 3, "1:02:03" → 3723; null when it isn't a time. */
export function parseTimestamp(raw: string): number | null {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(raw.trim());
  if (!m) return null;
  const [, h = "0", min = "0", sec = "0", frac = ""] = m;
  if (Number(sec) > 59 || (m[1] !== undefined && Number(min) > 59)) return null;
  return Number(h) * 3600 + Number(min) * 60 + Number(sec) + (frac ? Number(`0.${frac}`) : 0);
}

/** Reads a chapter list ("0:17  2. Describe your business" per line), sorted by time. Lines that don't parse are skipped. */
export function parseChapters(text: string): Chapter[] {
  const out: Chapter[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(\S+)\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const start = parseTimestamp(m[1] ?? "");
    if (start === null) continue;
    const titled = /^(\d{1,2})\.\s+(.+)$/.exec(m[2] ?? "");
    out.push(titled ? { start, n: Number(titled[1]), title: titled[2] ?? "" } : { start, n: null, title: m[2] ?? "" });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** 80 → "1:20", 3723 → "1:02:03": how a time reads next to a chapter. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** 80.5 → "00:01:20.500": a WebVTT timestamp. */
export function vttTime(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms % 1000, 3)}`;
}

/** Cue text can't hold "-->" or a blank line; "<" and "&" are escaped. */
function cueText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/-->/g, "->").replace(/\n\s*\n/g, "\n").trim();
}

export interface Cue {
  start: number;
  end: number;
  text: string;
  /** WebVTT cue settings, like "line:6%" (shown near the top). */
  settings?: string;
}

/** A WebVTT file from cues (each must end after it starts). */
export function toVtt(cues: readonly Cue[]): string {
  const body = cues.map((c, i) => `${i + 1}\n${vttTime(c.start)} --> ${vttTime(c.end)}${c.settings ? ` ${c.settings}` : ""}\n${cueText(c.text)}`).join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

/** Chapter cues: each runs until the next one starts (the last until the end of the video). */
export function chapterCues(chapters: readonly Chapter[], duration: number, title: (c: Chapter) => string): Cue[] {
  return chapters.map((c, i) => ({ start: c.start, end: chapters[i + 1]?.start ?? duration, text: title(c) }));
}

/** Caption cues from their times and texts (the same length, in the same order). */
export function captionCues(times: readonly (readonly [number, number])[], texts: readonly string[], settings?: string): Cue[] {
  if (times.length !== texts.length) throw new Error(`captions: ${times.length} times but ${texts.length} texts`);
  return times.map(([start, end], i) => ({ start, end, text: texts[i] ?? "", ...(settings ? { settings } : {}) }));
}

/** Where in the video each of the guide's ten sections starts, by section number. */
export function sectionStarts(chapters: readonly Chapter[]): Map<number, number> {
  return new Map(chapters.filter((c): c is Chapter & { n: number } => c.n !== null).map((c) => [c.n, c.start]));
}

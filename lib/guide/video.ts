/**
 * The "How to use Gojoline" video (2026-11-19): its chapters, its on-screen captions and the
 * WebVTT files made from them. Pure functions with no imports, so `scripts/guide-assets.mts`
 * can run this file directly with Node's type stripping.
 */

/** The video's chapter list as the editor wrote it (m:ss, then the title). */
export const CHAPTERS_TXT = `0:00  Intro
0:03  1. Start
0:17  2. Describe your business
0:32  3. Watch it build
0:48  4. Look around
1:20  5. Change anything by chatting
2:10  6. Your photos
2:34  7. Versions
3:02  8. Publish
3:19  9. Your site dashboard
4:13  10. Plan and payments
4:44  Closing
`;

/** Length of public/guide/gojoline-guide-720.mp4, in seconds, and its size in bytes. */
export const VIDEO_SECONDS = 288.37;
export const VIDEO_BYTES = 5_645_679;

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
  [19.3, 29.6],
  [29.6, 32.3],
  [34.1, 43.42],
  [43.42, 48.52],
  [50.32, 66.42],
  [66.42, 80.82],
  [82.62, 89.38],
  [89.38, 99.38],
  [99.38, 108.68],
  [108.68, 117.25],
  [117.25, 130.05],
  [131.85, 143.35],
  [143.35, 147.28],
  [147.28, 154.38],
  [156.18, 174.58],
  [174.58, 182.93],
  [184.73, 189.23],
  [189.23, 193.33],
  [193.33, 199.43],
  [201.23, 209.43],
  [209.43, 219.03],
  [219.03, 229.93],
  [229.93, 235.13],
  [235.13, 249.43],
  [249.43, 253.23],
  [255.03, 267.43],
  [267.43, 277.53],
  [277.53, 280.13],
  [280.13, 285.13],
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

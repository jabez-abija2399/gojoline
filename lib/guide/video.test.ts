import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { guideAm } from "@/lib/i18n/messages/guide-am";
import { guideEn } from "@/lib/i18n/messages/guide-en";
import { DESKTOP, GUIDE_SECTIONS, GUIDE_SHOTS, PHONE, POSTER_FILE, VIDEO_FILE, shotSrc, shotSrcSet } from "./sections";
import { CAPTION_TIMES, CHAPTERS_TXT, VIDEO_BYTES, VIDEO_SECONDS, captionCues, chapterCues, clock, parseChapters, parseTimestamp, sectionStarts, toVtt, vttTime } from "./video";
import { chapterTitle, vttFiles } from "./vtt";

const PUBLIC = join(process.cwd(), "public");

describe("parseTimestamp", () => {
  it("reads m:ss, h:mm:ss and fractions", () => {
    expect(parseTimestamp("0:00")).toBe(0);
    expect(parseTimestamp("0:03")).toBe(3);
    expect(parseTimestamp("1:20")).toBe(80);
    expect(parseTimestamp("4:44")).toBe(284);
    expect(parseTimestamp("12:05")).toBe(725);
    expect(parseTimestamp("1:02:03")).toBe(3723);
    expect(parseTimestamp(" 2:10.5 ")).toBe(130.5);
  });
  it("refuses what isn't a time", () => {
    for (const bad of ["", "1", "1:2", "1:60", "a:10", "1:70:00", "-1:00", "1:00:00:00"]) expect(parseTimestamp(bad)).toBeNull();
  });
});

describe("parseChapters", () => {
  it("reads the video's chapter list: intro, ten numbered parts, closing", () => {
    const c = parseChapters(CHAPTERS_TXT);
    expect(c).toHaveLength(12);
    expect(c[0]).toEqual({ start: 0, n: null, title: "Intro" });
    expect(c[1]).toEqual({ start: 3, n: 1, title: "Start" });
    expect(c[5]).toEqual({ start: 80, n: 5, title: "Change anything by chatting" });
    expect(c[10]).toEqual({ start: 253, n: 10, title: "Plan and payments" });
    expect(c[11]).toEqual({ start: 284, n: null, title: "Closing" });
    expect(c.map((x) => x.n).filter((n) => n !== null)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it("skips blank and broken lines, keeps titles with dots and sorts by time", () => {
    const c = parseChapters("\n1:00  2. Second part\nnot a line\n0:10\tFirst, then more. Words\r\n  \n9:99 Bad\n");
    expect(c).toEqual([
      { start: 10, n: null, title: "First, then more. Words" },
      { start: 60, n: 2, title: "Second part" },
    ]);
  });
  it("starts every section where the video says", () => {
    const starts = sectionStarts(parseChapters(CHAPTERS_TXT));
    expect([...starts.keys()]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(starts.get(2)).toBe(17);
    expect(starts.get(9)).toBe(199);
    // Every chapter starts inside the video, in order.
    const times = [...starts.values()];
    expect(times.every((t, i) => t < VIDEO_SECONDS && (i === 0 || t > (times[i - 1] ?? 0)))).toBe(true);
  });
});

describe("times", () => {
  it("reads like a clock next to a chapter", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(17)).toBe("0:17");
    expect(clock(80.9)).toBe("1:20");
    expect(clock(3723)).toBe("1:02:03");
    expect(clock(-4)).toBe("0:00");
  });
  it("writes WebVTT timestamps", () => {
    expect(vttTime(0)).toBe("00:00:00.000");
    expect(vttTime(80.5)).toBe("00:01:20.500");
    expect(vttTime(43.42)).toBe("00:00:43.420");
    expect(vttTime(3723.001)).toBe("01:02:03.001");
  });
});

describe("WebVTT", () => {
  it("writes cues and keeps their text safe", () => {
    expect(toVtt([{ start: 1, end: 2.5, text: "A <b> & --> c\n\nd" }])).toBe("WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.500\nA &lt;b> &amp; -> c\nd\n");
    expect(toVtt(captionCues([[0, 1]], ["Hi"], "line:6%"))).toBe("WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000 line:6%\nHi\n");
  });
  it("runs each chapter until the next and the last until the end", () => {
    const cues = chapterCues(parseChapters(CHAPTERS_TXT), VIDEO_SECONDS, (c) => c.title);
    expect(cues[0]).toEqual({ start: 0, end: 3, text: "Intro" });
    expect(cues.at(-1)).toEqual({ start: 284, end: VIDEO_SECONDS, text: "Closing" });
    expect(cues.every((c) => c.end > c.start)).toBe(true);
  });
  it("has one caption per time, in order, in both languages", () => {
    expect(guideEn.video.captions).toHaveLength(CAPTION_TIMES.length);
    expect(guideAm.video.captions).toHaveLength(CAPTION_TIMES.length);
    expect(CAPTION_TIMES.every(([a, b], i) => b > a && b <= VIDEO_SECONDS && (i === 0 || a >= (CAPTION_TIMES[i - 1]?.[1] ?? 0)))).toBe(true);
    expect(() => captionCues(CAPTION_TIMES, ["one"])).toThrow(/captions/);
  });
  it("names chapters in the guide's own words", () => {
    const [intro, start, , , , , , , , , , closing] = parseChapters(CHAPTERS_TXT);
    expect(chapterTitle(intro!, guideAm)).toBe(guideAm.video.intro);
    expect(chapterTitle(start!, guideEn)).toBe("1. Start");
    expect(chapterTitle(start!, guideAm)).toBe(`1. ${guideAm.sections.start.title}`);
    expect(chapterTitle(closing!, guideEn)).toBe("Closing");
  });
  it("matches the committed files in public/guide (re-run scripts/guide-assets.mts after editing)", () => {
    const files = vttFiles({ en: guideEn, am: guideAm });
    expect(Object.keys(files).sort()).toEqual(["/guide/captions-am.vtt", "/guide/captions-en.vtt", "/guide/chapters-am.vtt", "/guide/chapters-en.vtt"]);
    for (const [path, body] of Object.entries(files)) expect(readFileSync(join(PUBLIC, path), "utf8"), path).toBe(body);
    // No placeholder left unfilled: captions are fixed text, not the guide's {label} templates.
    for (const [path, body] of Object.entries(files)) expect(body, path).not.toMatch(/[{}]/);
    // The captions say what the video shows: email sign-in only, the real address.
    expect(files["/guide/captions-en.vtt"]).toContain("Sign in with your email. We send you a 6-digit code.");
    expect(files["/guide/captions-en.vtt"]).toContain("Go to gojoline.afridea.et and press Start free.");
  });
});

describe("files", () => {
  it("the video, at the size the download link says, and its poster", () => {
    expect(statSync(join(PUBLIC, VIDEO_FILE)).size).toBe(VIDEO_BYTES);
    // Small enough for slow connections (target: 15 MB at most).
    expect(VIDEO_BYTES).toBeLessThan(15_000_000);
    expect(existsSync(join(PUBLIC, POSTER_FILE))).toBe(true);
  });
});

describe("screenshots", () => {
  it("every section has 1 or 2 shots, one shown on phones, each with alt text in both languages", () => {
    for (const id of GUIDE_SECTIONS) {
      const shots = GUIDE_SHOTS[id];
      expect(shots.length, id).toBeGreaterThanOrEqual(1);
      expect(shots.length, id).toBeLessThanOrEqual(2);
      expect(shots[0]?.phone, id).toBeTruthy();
      expect(guideEn.sections[id].shots, id).toHaveLength(shots.length);
      expect(guideAm.sections[id].shots, id).toHaveLength(shots.length);
    }
  });
  it("every file the page asks for exists", () => {
    for (const s of Object.values(GUIDE_SHOTS).flat()) {
      for (const f of ["avif", "webp"] as const) {
        for (const w of DESKTOP.widths) expect(existsSync(join(PUBLIC, shotSrc(s.desktop, w, f))), `${s.desktop}-${w}.${f}`).toBe(true);
        if (s.phone) for (const w of PHONE.widths) expect(existsSync(join(PUBLIC, shotSrc(s.phone, w, f))), `${s.phone}-${w}.${f}`).toBe(true);
      }
    }
    expect(shotSrcSet("x", [720, 1440], "webp")).toBe("/guide/shots/x-720.webp 720w, /guide/shots/x-1440.webp 1440w");
  });
});

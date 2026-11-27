/**
 * Makes the guide's files in public/guide/ (2026-11-19):
 *   - the WebVTT captions and chapters (always, from lib/guide and the guide messages);
 *   - with --shots <dir>: each screenshot in lib/guide/sections.ts as AVIF and WebP at the
 *     widths listed there;
 *   - with --video <file.mp4>: a 720p H.264 copy for slow connections (needs ffmpeg) and the
 *     poster picture. Then run scripts/guide-video-polish.py on it for the pointer and music.
 *
 *   - with --edits <polished.mp4>: the burned-in review edits (VIDEO_EDITS) on the final video.
 *
 *   node --experimental-strip-types scripts/guide-assets.mts [--shots <dir>] [--video <file>] [--edits <file>]
 *
 * One-off authoring tool: outputs are committed. Re-run after changing captions or titles
 * (lib/guide/vtt.test.ts fails until the files match).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { guideAm } from "../lib/i18n/messages/guide-am.ts";
import { guideEn } from "../lib/i18n/messages/guide-en.ts";
import { DESKTOP, GUIDE_SHOTS, PHONE, POSTER_FILE, VIDEO_FILE } from "../lib/guide/sections.ts";
import { vttFiles } from "../lib/guide/vtt.ts";

const PUBLIC = new URL("../public", import.meta.url).pathname;
const FONT = "/usr/share/fonts/opentype/inter";
/** Shown wherever the sample customer's real-looking number was. */
const FAKE_PHONE = "0900 000 000";
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

for (const [path, body] of Object.entries(vttFiles({ en: guideEn, am: guideAm }))) {
  writeFileSync(join(PUBLIC, path), body);
  console.log(path);
}

/** The sample customer's phone number in these shots is painted over with a fake one (box in the shot's pixels). */
const SHOT_EDITS: Record<string, { x: number; y: number; w: number; h: number; size: number }> = {
  "09-dashboard-messages": { x: 573, y: 390, w: 110, h: 22, size: 15 },
  "phone-09-dashboard-messages": { x: 32, y: 639, w: 110, h: 22, size: 15 },
};

async function shotSource(dir: string, name: string): Promise<Buffer> {
  const file = join(dir, `${name}.png`);
  const e = SHOT_EDITS[name];
  if (!e) return sharp(file).toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${e.w}" height="${e.h}"><rect width="100%" height="100%" fill="#fff"/><text x="2" y="${e.h - 5}" font-family="Inter" font-size="${e.size}" fill="#121212">${FAKE_PHONE}</text></svg>`;
  return sharp(file).composite([{ input: Buffer.from(svg), left: e.x, top: e.y }]).toBuffer();
}

const shots = arg("--shots");
if (shots) {
  mkdirSync(join(PUBLIC, "guide/shots"), { recursive: true });
  const jobs = Object.values(GUIDE_SHOTS).flatMap((list) =>
    list.flatMap((s) => [
      ...DESKTOP.widths.map((w) => ({ name: s.desktop, w })),
      ...(s.phone ? PHONE.widths.map((w) => ({ name: s.phone as string, w })) : []),
    ]),
  );
  for (const { name, w } of jobs) {
    const img = sharp(await shotSource(shots, name)).resize({ width: w });
    await img.clone().avif({ quality: 55, effort: 6 }).toFile(join(PUBLIC, `guide/shots/${name}-${w}.avif`));
    await img.clone().webp({ quality: 78 }).toFile(join(PUBLIC, `guide/shots/${name}-${w}.webp`));
    console.log(name, w);
  }
}

/**
 * Edits burned into the finished 720p video (2026-11-19 review, redone 2026-11-27 for the
 * re-recorded Lalibela video): the sign-in caption no longer mentions phone numbers (codes by SMS
 * aren't open yet), the Settings caption says Telegram alerts are on Starter and Business, and the
 * sample customer's phone number in the booking form and in Messages is painted over with an
 * obviously fake one. Times are seconds in the polished video; positions are 720p pixels.
 * Run with --edits <polished.mp4> after scripts/guide-video-polish.py (keeps the music).
 */
const VIDEO_EDITS = [
  `drawbox=x=0:y=652:w=1280:h=50:color=0xF7F5F1@1:t=fill:enable='between(t,12.05,14.85)'`,
  `drawtext=fontfile=${FONT}/Inter-SemiBold.otf:text='Sign in with your email. We send you a 6-digit code.':fontsize=27:fontcolor=0x121212:x=(w-text_w)/2:y=667:enable='between(t,12.05,14.85)'`,
  `drawbox=x=0:y=652:w=1280:h=50:color=0xF7F5F1@1:t=fill:enable='between(t,301.1,305.0)'`,
  `drawtext=fontfile=${FONT}/Inter-SemiBold.otf:text='Settings\\: on Starter or Business, get every booking on Telegram.':fontsize=27:fontcolor=0x121212:x=(w-text_w)/2:y=667:enable='between(t,301.1,305.0)'`,
  `drawbox=x=675:y=309:w=92:h=19:color=0xFDFBFC@1:t=fill:enable='between(t,261.85,265.1)'`,
  `drawtext=fontfile=${FONT}/Inter-Regular.otf:text='${FAKE_PHONE}':fontsize=14:fontcolor=0x222222:x=679:y=313:enable='between(t,262.4,265.1)'`,
  `drawbox=x=533:y=277:w=84:h=17:color=white@1:t=fill:enable='between(t,281.4,284.15)'`,
  `drawtext=fontfile=${FONT}/Inter-Regular.otf:text='${FAKE_PHONE}':fontsize=12.5:fontcolor=0x121212:x=536:y=280:enable='between(t,281.4,284.15)'`,
  `drawbox=x=531:y=294:w=84:h=17:color=white@1:t=fill:enable='between(t,284.15,286.7)'`,
  `drawtext=fontfile=${FONT}/Inter-Regular.otf:text='${FAKE_PHONE}':fontsize=12.5:fontcolor=0x121212:x=534:y=297:enable='between(t,284.15,286.7)'`,
];

const edits = arg("--edits");
if (edits) {
  const out = join(PUBLIC, VIDEO_FILE);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", edits, "-vf", VIDEO_EDITS.join(","), "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "450k", "-bufsize", "900k", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "copy", out]);
  console.log(VIDEO_FILE, `${(statSync(out).size / 1e6).toFixed(1)} MB`);
}

const video = arg("--video");
if (video) {
  const out = join(PUBLIC, VIDEO_FILE);
  // 720p, no sound track (the video has none), small enough for slow connections; starts playing before it has all loaded.
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", video, "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "450k", "-bufsize", "900k", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out]);
  const frame = execFileSync("ffmpeg", ["-v", "error", "-ss", "1", "-i", out, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"]);
  await sharp(frame).webp({ quality: 75 }).toFile(join(PUBLIC, POSTER_FILE));
  console.log(VIDEO_FILE, `${(statSync(out).size / 1e6).toFixed(1)} MB`);
}

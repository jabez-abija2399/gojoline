/**
 * Makes the guide's files in public/guide/ (2026-11-19):
 *   - the WebVTT captions and chapters (always, from lib/guide and the guide messages);
 *   - with --shots <dir>: each screenshot in lib/guide/sections.ts as AVIF and WebP at the
 *     widths listed there;
 *   - with --video <file.mp4>: a 720p H.264 copy for slow connections (needs ffmpeg) and the
 *     poster picture.
 *
 *   node --experimental-strip-types scripts/guide-assets.mts [--shots <dir>] [--video <file>]
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
 * Edits burned into the video (2026-11-19 review): the sign-in caption no longer mentions phone
 * numbers (codes by SMS aren't open yet), and the sample customer's phone number in the booking
 * form and in Messages is painted over with an obviously fake one. Times are seconds in the
 * source; positions are 1080p pixels.
 */
const VIDEO_EDITS = [
  `drawbox=x=0:y=985:w=1920:h=70:color=0xFAF8F4@1:t=fill:enable='between(t,12.05,14.85)'`,
  `drawtext=fontfile=${FONT}/Inter-SemiBold.otf:text='Sign in with your email. We send you a 6-digit code.':fontsize=40:fontcolor=0x121212:x=(w-text_w)/2:y=1000:enable='between(t,12.05,14.85)'`,
  `drawbox=x=1008:y=460:w=150:h=40:color=white@1:t=fill:enable='between(t,206,215)'`,
  `drawtext=fontfile=${FONT}/Inter-Regular.otf:text='${FAKE_PHONE}':fontsize=21:fontcolor=0x222222:x=1018:y=470:enable='between(t,206,215)'`,
  `drawbox=x=800:y=407:w=132:h=34:color=white@1:t=fill:enable='between(t,228,237)'`,
  `drawtext=fontfile=${FONT}/Inter-Regular.otf:text='${FAKE_PHONE}':fontsize=21:fontcolor=0x121212:x=804:y=419:enable='between(t,228,237)'`,
];

const video = arg("--video");
if (video) {
  const out = join(PUBLIC, VIDEO_FILE);
  // 720p, no sound track (the video has none), small enough for slow connections; starts playing before it has all loaded.
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", video, "-vf", [...VIDEO_EDITS, "scale=1280:720:flags=lanczos"].join(","), "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "450k", "-bufsize", "900k", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out]);
  const frame = execFileSync("ffmpeg", ["-v", "error", "-ss", "1", "-i", out, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"]);
  await sharp(frame).webp({ quality: 75 }).toFile(join(PUBLIC, POSTER_FILE));
  console.log(VIDEO_FILE, `${(statSync(out).size / 1e6).toFixed(1)} MB`);
}

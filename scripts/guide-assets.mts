/**
 * Makes the guide's files in public/guide/ (2026-11-19):
 *   - the WebVTT captions and chapters (always, from lib/guide and the guide messages);
 *   - with --shots <dir>: each screenshot in lib/guide/sections.ts as AVIF and WebP at the
 *     widths listed there;
 *   - with --video <file.mp4>: a 720p H.264 copy for slow connections (needs ffmpeg) and the
 *     poster picture. Then run scripts/guide-video-polish.py on it for the pointer and music.
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
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};

for (const [path, body] of Object.entries(vttFiles({ en: guideEn, am: guideAm }))) {
  writeFileSync(join(PUBLIC, path), body);
  console.log(path);
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
    const img = sharp(join(shots, `${name}.png`)).resize({ width: w });
    await img.clone().avif({ quality: 55, effort: 6 }).toFile(join(PUBLIC, `guide/shots/${name}-${w}.avif`));
    await img.clone().webp({ quality: 78 }).toFile(join(PUBLIC, `guide/shots/${name}-${w}.webp`));
    console.log(name, w);
  }
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

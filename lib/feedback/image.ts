import "server-only";
import sharp from "sharp";

/** About 16 megapixels: a phone screenshot is 2–4 MP; anything bigger is refused before decoding. */
const MAX_PIXELS = 16_000_000;
const MAX_SIDE = 1600;
const THUMB_WIDTH = 480;

/** JPEG, PNG, GIF, WebP and HEIF/AVIF by their first bytes; anything else is never handed to the decoder. */
export function looksLikeImage(b: Buffer): boolean {
  if (b.length < 12) return false;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true;
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  if (b.subarray(0, 4).toString("latin1") === "GIF8") return true;
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return true;
  if (b.subarray(4, 8).toString("latin1") === "ftyp" && /^(heic|heix|hevc|mif1|msf1|avif)$/.test(b.subarray(8, 12).toString("latin1"))) return true;
  return false;
}

export type Screenshot = { ok: true; full: Buffer; thumb: Buffer } | { ok: false };

/**
 * Decodes the upload once (pixel limit, first frame only), fixes rotation, drops metadata and
 * writes WebP at most 1600 px. The thumbnail is made from that small, trusted output.
 */
export async function processScreenshot(input: Buffer): Promise<Screenshot> {
  if (!looksLikeImage(input)) return { ok: false };
  try {
    const full = await sharp(input, { limitInputPixels: MAX_PIXELS, animated: false })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    const thumb = await sharp(full).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
    return { ok: true, full, thumb };
  } catch {
    return { ok: false };
  }
}

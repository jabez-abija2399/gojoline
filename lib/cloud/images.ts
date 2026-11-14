import "server-only";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1600;

export type ImageResult =
  | { ok: true; data: Buffer; width: number; height: number; mime: "image/webp" }
  | { ok: false; error: "too_large" | "not_image" };

/**
 * Re-encodes an uploaded photo: decodes it (only real JPEG/PNG/WebP/AVIF/HEIF/GIF), fixes
 * rotation, resizes to at most 1600 px, strips metadata (GPS etc.) and saves WebP.
 * Anything that isn't a real image is refused; nothing uploaded is served as-is.
 */
export async function processImage(input: Buffer): Promise<ImageResult> {
  if (input.length > MAX_UPLOAD_BYTES) return { ok: false, error: "too_large" };
  try {
    const meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
    if (!meta.format || !["jpeg", "png", "webp", "avif", "heif", "gif"].includes(meta.format)) return { ok: false, error: "not_image" };
    const { data, info } = await sharp(input, { limitInputPixels: 40_000_000, animated: false })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    return { ok: true, data, width: info.width, height: info.height, mime: "image/webp" };
  } catch {
    return { ok: false, error: "not_image" };
  }
}

/** Safe file name from the upload's name: lowercase, dashes, .webp. */
export function assetName(original: string, taken: (name: string) => boolean): string {
  const base =
    original
      .replace(/\.[a-z0-9]{1,5}$/i, "")
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "photo";
  let name = `${base}.webp`;
  for (let i = 2; taken(name); i++) name = `${base}-${i}.webp`;
  return name;
}

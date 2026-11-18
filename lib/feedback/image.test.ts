import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { looksLikeImage, processScreenshot } from "./image";

describe("processScreenshot", () => {
  it("re-encodes a photo to WebP with a 480 px thumbnail", async () => {
    const r = await processScreenshot(readFileSync("e2e/fixtures/photo.jpg"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [full, thumb] = await Promise.all([sharp(r.full).metadata(), sharp(r.thumb).metadata()]);
    expect(full.format).toBe("webp");
    expect(Math.max(full.width!, full.height!)).toBeLessThanOrEqual(1600);
    expect(thumb.width).toBeLessThanOrEqual(480);
  });

  it("refuses files that aren't images, and images over about 16 megapixels", async () => {
    expect(await processScreenshot(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toEqual({ ok: false });
    expect(looksLikeImage(readFileSync("e2e/fixtures/fake.jpg"))).toBe(false);
    const huge = await sharp({ create: { width: 5000, height: 4000, channels: 3, background: "#fff" } }).png({ compressionLevel: 9 }).toBuffer();
    expect(await processScreenshot(huge)).toEqual({ ok: false });
  });
});

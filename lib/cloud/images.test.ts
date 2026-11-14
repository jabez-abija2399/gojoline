import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { DbProjectStore } from "@/lib/projects/db-store";
import { makeUser, testDb } from "@/test/db";
import { DbAssetStore } from "./assets";
import { assetName, processImage } from "./images";

async function jpeg(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#8A4B24" } }).withMetadata({ exif: { IFD0: { Copyright: "secret-gps" } } }).jpeg().toBuffer();
}

describe("processImage", () => {
  it("re-encodes to WebP, shrinks big photos and drops metadata", async () => {
    const r = await processImage(await jpeg(3200, 2000));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([r.width, r.height]).toEqual([1600, 1000]);
    const meta = await sharp(r.data).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
  });
  it("refuses things that aren't images", async () => {
    expect(await processImage(Buffer.from("<svg onload=alert(1)>"))).toEqual({ ok: false, error: "not_image" });
    expect(await processImage(Buffer.from("%PDF-1.4"))).toEqual({ ok: false, error: "not_image" });
    expect(await processImage(Buffer.alloc(9 * 1024 * 1024))).toEqual({ ok: false, error: "too_large" });
  });
  it("makes safe unique names", () => {
    const taken = new Set(["coffee-cup.webp"]);
    expect(assetName("Coffee Cup!.JPG", (n) => taken.has(n))).toBe("coffee-cup-2.webp");
    expect(assetName("../../etc/passwd", () => false)).toBe("etc-passwd.webp");
    expect(assetName("ቡና.png", () => false)).toBe("photo.webp");
  });
});

describe("DbAssetStore", () => {
  it("keeps photos per owner and project", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    const p = await new DbProjectStore(db).createProject("alice", { name: "", locale: "en" });
    const assets = new DbAssetStore(db);
    const img = await processImage(await jpeg(100, 80));
    if (!img.ok) throw new Error("image");
    await assets.add("alice", p.id, { name: "a.webp", mime: img.mime, width: img.width, height: img.height, data: img.data });
    expect((await assets.list("alice", p.id)).map((a) => a.name)).toEqual(["a.webp"]);
    expect(await assets.list("bob", p.id)).toEqual([]);
    expect(await assets.get("bob", p.id, "a.webp")).toBeNull();
    expect((await assets.files("alice", p.id))[0]!.path).toBe("public/images/a.webp");
    await assets.remove("bob", p.id, "a.webp");
    expect(await assets.list("alice", p.id)).toHaveLength(1);
  }, 30_000);
});

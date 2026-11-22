import { describe, expect, it } from "vitest";
import { readVideoUpload, sniffVideo } from "./upload";

const mp4 = () => {
  const b = Buffer.alloc(64);
  b.writeUInt32BE(24, 0);
  b.write("ftypisom", 4);
  return b;
};
const stream = (...parts: Uint8Array[]) => new ReadableStream<Uint8Array>({ start(c) { for (const p of parts) c.enqueue(p); c.close(); } });

describe("video uploads", () => {
  it("knows MP4 and MOV by their bytes, not their names", () => {
    expect(sniffVideo(mp4())).toEqual({ type: "video/mp4", ext: "mp4" });
    const mov = mp4();
    mov.write("qt  ", 8);
    expect(sniffVideo(mov)).toEqual({ type: "video/quicktime", ext: "mov" });
    expect(sniffVideo(Buffer.from("<html><script>alert(1)</script>"))).toBeNull();
  });

  it("stops reading past the limit and refuses non-videos and empty bodies", async () => {
    expect(await readVideoUpload(stream(mp4()), 1000)).toMatchObject({ type: "video/mp4" });
    expect(await readVideoUpload(stream(mp4(), mp4()), 100)).toEqual({ error: "too_big" });
    expect(await readVideoUpload(stream(Buffer.from("GIF89a....xxxxxxxx")), 1000)).toEqual({ error: "not_video" });
    expect(await readVideoUpload(null, 1000)).toEqual({ error: "empty" });
    expect(await readVideoUpload(stream(), 1000)).toEqual({ error: "empty" });
  });
});

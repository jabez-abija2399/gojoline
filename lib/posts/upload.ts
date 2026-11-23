/**
 * Videos an admin uploads to a post: MP4, which every network takes and every phone or CapCut
 * exports (an iPhone's MOV is refused with a hint to export as MP4), up to 60 MB.
 */
export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024;

export type VideoUpload = { data: Buffer; type: "video/mp4"; ext: "mp4" } | { error: "too_big" | "not_video" | "empty" | "mov" };

/** The file's own first bytes decide what it is (an ISO media "ftyp" box), never its name or header. */
export function sniffVideo(head: Uint8Array): { type: "video/mp4"; ext: "mp4" } | "mov" | null {
  if (head.length < 12) return null;
  const box = String.fromCharCode(...head.subarray(4, 8));
  if (box !== "ftyp") return null;
  const brand = String.fromCharCode(...head.subarray(8, 12));
  return brand === "qt  " ? "mov" : { type: "video/mp4", ext: "mp4" };
}

/** Reads a request body up to `max` bytes (stops early beyond it) and checks it is a video. */
export async function readVideoUpload(body: ReadableStream<Uint8Array> | null, max: number): Promise<VideoUpload> {
  if (!body) return { error: "empty" };
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel().catch(() => undefined);
      return { error: "too_big" };
    }
    chunks.push(value);
  }
  if (size === 0) return { error: "empty" };
  const kind = sniffVideo(Buffer.concat(chunks.slice(0, 4)).subarray(0, 12));
  if (kind === "mov") return { error: "mov" };
  if (!kind) return { error: "not_video" };
  return { data: Buffer.concat(chunks, size), ...kind };
}

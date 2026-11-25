/**
 * An MP4's length in seconds, read from its movie header ("mvhd" box), or null when it can't be
 * read. Enough to refuse a video longer than the TikTok account allows before uploading it.
 */
export function mp4Seconds(buf: Buffer): number | null {
  const at = buf.indexOf("mvhd");
  if (at < 4 || at + 32 > buf.length) return null;
  const version = buf[at + 4];
  // version 0: 32-bit times; version 1: 64-bit times.
  const base = at + 8;
  if (version === 1) {
    if (base + 28 > buf.length) return null;
    const scale = buf.readUInt32BE(base + 16);
    const duration = Number(buf.readBigUInt64BE(base + 20));
    return scale > 0 ? duration / scale : null;
  }
  const scale = buf.readUInt32BE(base + 8);
  const duration = buf.readUInt32BE(base + 12);
  return scale > 0 ? duration / scale : null;
}

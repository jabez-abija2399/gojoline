/**
 * Makes a receipt photo small enough to send quickly on a slow connection: the longest side at
 * most `max` pixels, as JPEG. Phone photos of 4-8 MB become ~200-400 KB and stay readable.
 * Returns the original when it is already small, when the browser can't decode it, or when the
 * result would not be smaller (the server checks the type and size again either way).
 */
export async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    // Size first (cheap), then decode straight to the smaller size: a 50 MP photo decoded whole
    // is ~200 MB, enough to crash a tab on a low-end phone.
    const { width, height } = await dimensions(file);
    const scale = Math.min(1, max / Math.max(width, height));
    if (scale === 1 && file.size <= 1_000_000) return file;
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const bmp = await createImageBitmap(file, { resizeWidth: w, resizeHeight: h, resizeQuality: "high" });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // A white page under transparent PNG screenshots (JPEG has no transparency).
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** The photo's size in pixels, read without decoding every pixel up front. */
function dimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => (URL.revokeObjectURL(url), resolve({ width: img.naturalWidth, height: img.naturalHeight }));
    img.onerror = () => (URL.revokeObjectURL(url), reject(new Error("unreadable image")));
    img.src = url;
  });
}

/**
 * Reads a request body as text, stopping at `max` bytes (Content-Length is never trusted).
 * Null when the body is larger.
 */
export async function readCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** JSON from a capped body: `too_large`, or the parsed value (null when it isn't JSON). */
export async function readJsonCapped(request: Request, max: number): Promise<{ tooLarge: true } | { tooLarge: false; value: unknown }> {
  const raw = await readCapped(request, max);
  if (raw === null) return { tooLarge: true };
  try {
    return { tooLarge: false, value: JSON.parse(raw) };
  } catch {
    return { tooLarge: false, value: null };
  }
}

export interface CspOptions {
  nonce: string;
  isDev: boolean;
  /** Extra origins allowed in frames (the live preview sandbox). */
  frameOrigins?: string[];
  /** Extra origins allowed for fetch/XHR (error reporting, etc.). */
  connectOrigins?: string[];
  /** Extra origins allowed for images (uploaded photos on storage). */
  imageOrigins?: string[];
}

/** Builds a strict, nonce-based Content-Security-Policy for the builder app. */
export function buildCsp(opts: CspOptions): string {
  const frames = opts.frameOrigins ?? [];
  const connect = opts.connectOrigins ?? [];
  const images = opts.imageOrigins ?? [];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${opts.nonce}'`,
      "'strict-dynamic'",
      ...(opts.isDev ? ["'unsafe-eval'"] : []),
    ],
    // Inline style attributes are used by React and next/font; scripts stay nonce-only.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:", ...images],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...connect, ...(opts.isDev ? ["ws:"] : [])],
    "frame-src": frames.length ? frames : ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const parts = Object.entries(directives).map(([key, values]) => `${key} ${values.join(" ")}`);
  if (!opts.isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/** A fresh, unguessable nonce per request (128 bits, base64). */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function splitOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^https:\/\/[a-z0-9.*-]+(:\d+)?$/i.test(s));
}

export function cspFromEnv(nonce: string, env: NodeJS.ProcessEnv = process.env): string {
  return buildCsp({
    nonce,
    isDev: env.NODE_ENV === "development",
    frameOrigins: splitOrigins(env.CSP_FRAME_ORIGINS ?? "https://*.vercel.run"),
    connectOrigins: splitOrigins(env.CSP_CONNECT_ORIGINS),
    imageOrigins: splitOrigins(env.CSP_IMAGE_ORIGINS),
  });
}

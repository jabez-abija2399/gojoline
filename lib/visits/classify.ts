/** Where a visitor came from, in the buckets the dashboard shows. */
export const SOURCES = ["telegram", "facebook", "google", "tiktok", "qr", "other", "direct"] as const;
export type Source = (typeof SOURCES)[number];
export const DEVICES = ["phone", "computer"] as const;
export type Device = (typeof DEVICES)[number];

const RULES: [Source, RegExp][] = [
  ["telegram", /(^|\.)(t\.me|telegram\.org|telegram\.me)$/],
  ["facebook", /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com|instagram\.com)$/],
  ["google", /(^|\.)google\.[a-z.]{2,8}$/],
  ["tiktok", /(^|\.)tiktok\.com$/],
];

/**
 * The bucket for one visit: a QR code scan (`?src=qr`) wins; then the referring site's host;
 * no referrer, or a link from the site itself, is "direct".
 */
export function sourceOf(ref: string, src: string | undefined, ownHosts: string[]): Source {
  if (src === "qr") return "qr";
  let host: string;
  try {
    host = new URL(ref).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (!host || ownHosts.includes(host)) return "direct";
  for (const [bucket, re] of RULES) if (re.test(host)) return bucket;
  return "other";
}

/** Phones and tablets count as phones; everything else as a computer. */
export function deviceOf(userAgent: string): Device {
  return /Mobi|Android|iPhone|iPad|iPod|Phone|Opera Mini|KaiOS/i.test(userAgent) ? "phone" : "computer";
}

/** Crawlers and link-preview fetchers are not people. */
export function isBot(userAgent: string): boolean {
  return !userAgent || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget|python|node-fetch|axios|playwright|puppeteer/i.test(userAgent);
}

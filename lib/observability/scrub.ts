/** Headers that may be sent with an error report; everything else (cookies, IPs, auth) is dropped. */
export const SAFE_HEADERS = new Set(["user-agent", "accept-language", "content-type", "accept"]);

/** Drops query strings and anything that looks like a token in a path (e.g. Telegram's /bot<token>/). */
export function scrubUrl(url: string): string {
  return url
    .split("?")[0]!
    .replace(/\/bot[^/]+/g, "/bot[redacted]")
    .replace(/\/[A-Za-z0-9_-]{32,}(?=\/|$)/g, "/[redacted]");
}

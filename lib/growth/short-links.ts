/**
 * Short tracking links (2026-11-25): gojoline.afridea.et/r/<code> instead of a long ?utm_… address,
 * for bios, channels and groups. Each code stands for one network and place; the visit lands on
 * the home page with the usual utm tags, so first-touch attribution and sign-up sources work as before.
 */
export const SHORT_LINKS = {
  tg: { source: "telegram", medium: "channel" },
  tgg: { source: "telegram", medium: "group" },
  ig: { source: "instagram", medium: "bio" },
  tt: { source: "tiktok", medium: "bio" },
  fb: { source: "facebook", medium: "profile" },
  yt: { source: "youtube", medium: "bio" },
} as const;

export type ShortCode = keyof typeof SHORT_LINKS;
export const SHORT_CODES = Object.keys(SHORT_LINKS) as ShortCode[];

export function isShortCode(v: string): v is ShortCode {
  return Object.hasOwn(SHORT_LINKS, v);
}

/** Where a short link leads: the home page with its utm tags. */
export function shortTarget(code: ShortCode): string {
  const { source, medium } = SHORT_LINKS[code];
  return `/?utm_source=${source}&utm_medium=${medium}&utm_campaign=link-${code}`;
}

/** The short address to share. */
export function shortUrl(appUrl: string, code: ShortCode): string {
  return `${appUrl.replace(/\/$/, "")}/r/${code}`;
}

import { z } from "zod";

/**
 * First-touch sign-up attribution: where a new owner first came from. Read from the landing
 * URL (?ref=, utm_*) or, without those, the referring site's host; kept in a first-party cookie
 * on Gojoline's own domain (no third-party trackers) and stored on the account at sign-up.
 */
export const ATTRIBUTION_COOKIE = "gojo_src";
/** First touch is kept this long. */
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 90;

export const SOURCES = ["badge", "referral", "telegram", "instagram", "tiktok", "facebook", "youtube", "google", "linkedin", "qr", "other", "direct"] as const;
export type Source = (typeof SOURCES)[number];

const token = z
  .string()
  .max(200)
  .transform((v) => v.trim().toLowerCase().replace(/[^\w.:-]/g, "").slice(0, 64))
  .pipe(z.string().min(1));

/** What the cookie holds (short keys keep it small). */
export const attributionSchema = z
  .object({
    /** ?ref= (site_<slug>, u_<code>, qr, or a campaign word). */
    r: token.optional(),
    s: token.optional(),
    m: token.optional(),
    c: token.optional(),
    /** The referring site's host, when there were no tags. */
    h: token.optional(),
    /** When it was first seen (ms). */
    t: z.number().int().nonnegative(),
  })
  .strict();
export type Attribution = z.infer<typeof attributionSchema>;

const opt = (v: string | null | undefined) => {
  const p = token.safeParse(v ?? "");
  return p.success ? p.data : undefined;
};

/**
 * The visit's attribution, or null when there is nothing to record (a direct visit, or a link
 * from Gojoline itself). `ownHost` is the app's host, so moving between our pages never counts.
 */
export function attributionFromRequest(params: URLSearchParams, referrer: string | null, ownHost: string, now = Date.now()): Attribution | null {
  const tags = { r: opt(params.get("ref")), s: opt(params.get("utm_source")), m: opt(params.get("utm_medium")), c: opt(params.get("utm_campaign")) };
  if (tags.r || tags.s || tags.m || tags.c) return dropEmpty({ ...tags, t: now });
  let host: string | undefined;
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : undefined;
  } catch {
    host = undefined;
  }
  // Sign-in round trips (Google) are not where anyone came from.
  if (!host || host === ownHost.toLowerCase() || host === "accounts.google.com") return null;
  return dropEmpty({ h: opt(host), t: now });
}

function dropEmpty(a: Attribution): Attribution {
  return Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined)) as Attribution;
}

/** The cookie's value before the cookie API percent-encodes it. */
export function encodeAttribution(a: Attribution): string {
  return JSON.stringify(a);
}

/** The cookie's raw (percent-encoded) value from a Cookie header, or null when it is missing or not ours (untrusted input). */
export function decodeAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw || raw.length > 600) return null;
  try {
    const parsed = attributionSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** One cookie from a Cookie header. */
export function cookieValue(header: string | null | undefined, name: string): string | undefined {
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}

const has = (v: string | undefined, re: RegExp) => Boolean(v && re.test(v));

/** The bucket the admin overview shows. */
export function classifySource(a: Attribution | null): Source {
  if (!a) return "direct";
  const { r, s, m, h } = a;
  if (has(r, /^site_/) || s === "gojoline_badge") return "badge";
  if (has(r, /^u_/)) return "referral";
  if (r === "qr" || s === "qr" || m === "qr") return "qr";
  const words = [r, s, h].filter(Boolean).join(" ");
  if (/\b(telegram|tg)\b|(^|[\s.])t\.me\b/.test(words)) return "telegram";
  if (/\b(instagram|ig)\b|instagram\.com/.test(words)) return "instagram";
  if (/tiktok/.test(words)) return "tiktok";
  if (/\b(facebook|fb)\b|facebook\.com|fb\.com/.test(words)) return "facebook";
  if (/\b(youtube|yt)\b|youtube\.com|youtu\.be/.test(words)) return "youtube";
  if (/\bgoogle\b|(^|\.)google\.[a-z.]+/.test(words)) return "google";
  if (/linkedin|lnkd\.in/.test(words)) return "linkedin";
  return words || m || a.c ? "other" : "direct";
}

/**
 * Which attribution to keep: the first one, except that an owner's invite link (?ref=u_…)
 * replaces any earlier source that wasn't an invite.
 */
export function keepFirstTouch(kept: Attribution | null, incoming: Attribution): Attribution {
  if (!kept) return incoming;
  return referralCodeOf(incoming) && !referralCodeOf(kept) ? incoming : kept;
}

/** The referral code in ?ref=u_<code>, if any. */
export function referralCodeOf(a: Attribution | null): string | null {
  const m = /^u_([a-z0-9]{6,16})$/.exec(a?.r ?? "");
  return m ? m[1]! : null;
}

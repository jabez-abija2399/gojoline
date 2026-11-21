import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

/**
 * A short-lived public address for one post's media (Instagram fetches media from a URL):
 * /api/public/post-media/<id>?exp=<unix>&sig=<hmac>. Signed with the server's secret; useless
 * after it expires and for any other post.
 */
/** A key only for these links, derived from the server secret (the secret itself never signs them). */
const linkKey = (secret: string) => Buffer.from(hkdfSync("sha256", secret, "gojoline", "post-media-links", 32));
const sign = (secret: string, id: string, exp: number) => createHmac("sha256", linkKey(secret)).update(`post-media:${id}:${exp}`).digest("base64url");

export function signedMediaUrl(appUrl: string, secret: string, id: string, now = Date.now(), ttlSeconds = 3600): string {
  const exp = Math.floor(now / 1000) + ttlSeconds;
  return `${appUrl}/api/public/post-media/${id}?exp=${exp}&sig=${sign(secret, id, exp)}`;
}

export function verifyMediaUrl(secret: string, id: string, exp: string | null, sig: string | null, now = Date.now()): boolean {
  const e = Number(exp);
  if (!secret || !sig || !Number.isInteger(e) || e < now / 1000) return false;
  const want = Buffer.from(sign(secret, id, e));
  const given = Buffer.from(sig);
  return want.length === given.length && timingSafeEqual(want, given);
}

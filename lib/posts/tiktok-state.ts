import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * The OAuth state for "Connect TikTok": a one-time nonce (kept in a `__Host-` cookie) plus a MAC
 * over the nonce and the signed-in admin's ID. The callback accepts it only with the same cookie
 * and the same admin, so a state minted in another session (or a planted cookie) never connects.
 */
const mac = (secret: string, userId: string, nonce: string) => createHmac("sha256", createHmac("sha256", secret).update("gojoline-tiktok-state-v1").digest()).update(`${userId}|${nonce}`).digest("base64url");

export function newTikTokState(secret: string, userId: string): { nonce: string; state: string } {
  const nonce = randomBytes(24).toString("base64url");
  return { nonce, state: `${nonce}.${mac(secret, userId, nonce)}` };
}

export function checkTikTokState(secret: string, userId: string, cookieNonce: string | undefined, state: string | null): boolean {
  if (!cookieNonce || !state) return false;
  const [nonce, given] = state.split(".");
  if (!nonce || !given) return false;
  const eq = (a: string, b: string) => {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  };
  return eq(nonce, cookieNonce) && eq(given, mac(secret, userId, nonce));
}

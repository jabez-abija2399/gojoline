import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Encrypts small secrets kept in the database (access tokens pasted in Admin), AES-256-GCM with a
 * key derived from the server's secret. Stored as "v1.<iv>.<tag>.<data>" (base64url).
 */
function key(secret: string): Buffer {
  if (secret.length < 32) throw new Error("server secret missing or too short");
  return Buffer.from(hkdfSync("sha256", secret, "gojoline", "sealed-settings-v1", 32));
}

export function seal(plain: string, secret: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(secret), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

/** The plain secret, or null when it can't be opened (other key, tampered, not sealed). */
export function unseal(sealed: string, secret: string): string | null {
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !data) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

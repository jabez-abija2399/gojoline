import { createHash, createHmac } from "node:crypto";

export interface SigV4Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
}

const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");
const hmac = (key: string | Buffer, data: string) => createHmac("sha256", key).update(data).digest();
/** RFC 3986 encoding, as SigV4 wants it (keeps unreserved characters only). */
export const uriEncode = (s: string, keepSlash = false) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`).replace(keepSlash ? /%2F/g : /$^/, "/");

/**
 * AWS Signature Version 4 for one request. `path` must already be URI-encoded; `query` values
 * are raw. Returns the headers to send (the given ones plus x-amz-date, x-amz-content-sha256
 * and Authorization). All given headers are signed.
 */
export function signV4(
  creds: SigV4Credentials,
  req: { method: string; host: string; path: string; query?: Record<string, string>; headers?: Record<string, string>; body?: Buffer | string; payloadHash?: string },
  now = new Date(),
): Record<string, string> {
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const payloadHash = req.payloadHash ?? sha256(req.body ?? "");
  const headers: Record<string, string> = { ...req.headers, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate };
  const all: Record<string, string> = { host: req.host };
  for (const [k, v] of Object.entries(headers)) all[k.toLowerCase()] = String(v).trim().replace(/\s+/g, " ");
  const names = Object.keys(all).sort();
  const canonicalQuery = Object.entries(req.query ?? {})
    .map(([k, v]) => [uriEncode(k), uriEncode(v)] as const)
    .sort(([a, x], [b, y]) => (a < b ? -1 : a > b ? 1 : x < y ? -1 : x > y ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const canonical = [req.method, req.path, canonicalQuery, names.map((n) => `${n}:${all[n]}\n`).join(""), names.join(";"), payloadHash].join("\n");
  const scope = `${day}/${creds.region}/${creds.service}/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const key = hmac(hmac(hmac(hmac(`AWS4${creds.secretAccessKey}`, day), creds.region), creds.service), "aws4_request");
  const signature = createHmac("sha256", key).update(toSign).digest("hex");
  return { ...headers, Authorization: `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${names.join(";")}, Signature=${signature}` };
}

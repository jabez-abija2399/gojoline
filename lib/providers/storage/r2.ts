import "server-only";
import { signV4, uriEncode } from "./sigv4";
import type { StorageProvider } from "./types";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  fetchImpl?: typeof fetch;
}

const xmlText = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&");

/** Cloudflare R2 through its S3-compatible API (path-style, region "auto"). */
export class R2StorageProvider implements StorageProvider {
  private host: string;
  private fetch: typeof fetch;

  constructor(private config: R2Config) {
    if (!/^[a-f0-9]{32}$/.test(config.accountId)) throw new Error("R2_ACCOUNT_ID must be the 32-character Cloudflare account ID");
    this.host = `${config.accountId}.r2.cloudflarestorage.com`;
    this.fetch = config.fetchImpl ?? fetch;
  }

  private async send(method: string, key: string | null, opts: { query?: Record<string, string>; headers?: Record<string, string>; body?: Buffer } = {}) {
    const path = `/${uriEncode(this.config.bucket)}${key === null ? "" : `/${uriEncode(key, true)}`}`;
    const headers = signV4(
      { accessKeyId: this.config.accessKeyId, secretAccessKey: this.config.secretAccessKey, region: "auto", service: "s3" },
      { method, host: this.host, path, query: opts.query, headers: opts.headers, body: opts.body },
    );
    const qs = opts.query ? `?${new URLSearchParams(opts.query).toString().replace(/\+/g, "%20")}` : "";
    return this.fetch(`https://${this.host}${path}${qs}`, { method, headers, body: opts.body ? new Uint8Array(opts.body) : undefined });
  }

  async put(key: string, data: Buffer | string, opts: { contentType?: string; cacheControl?: string } = {}) {
    const body = Buffer.from(data);
    const headers: Record<string, string> = { "content-type": opts.contentType ?? "application/octet-stream" };
    if (opts.cacheControl) headers["cache-control"] = opts.cacheControl;
    for (let attempt = 0; ; attempt++) {
      const res = await this.send("PUT", key, { headers, body });
      if (res.ok) return;
      // Retry rate limits and server errors a couple of times; anything else is a real failure.
      if (attempt >= 2 || (res.status !== 429 && res.status < 500)) throw new Error(`R2 put failed (${res.status}) for ${key}`);
      await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
    }
  }

  async get(key: string) {
    const res = await this.send("GET", key);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`R2 get failed (${res.status}) for ${key}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async delete(key: string) {
    const res = await this.send("DELETE", key);
    if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed (${res.status}) for ${key}`);
  }

  async list(prefix: string, opts: { delimiter?: string } = {}) {
    const keys: string[] = [];
    const prefixes: string[] = [];
    let token: string | undefined;
    do {
      const query: Record<string, string> = { "list-type": "2", prefix, ...(opts.delimiter ? { delimiter: opts.delimiter } : {}), ...(token ? { "continuation-token": token } : {}) };
      const res = await this.send("GET", null, { query });
      if (!res.ok) throw new Error(`R2 list failed (${res.status})`);
      const xml = await res.text();
      for (const m of xml.matchAll(/<Contents>[\s\S]*?<Key>([\s\S]*?)<\/Key>[\s\S]*?<\/Contents>/g)) keys.push(xmlText(m[1]!));
      for (const m of xml.matchAll(/<CommonPrefixes>\s*<Prefix>([\s\S]*?)<\/Prefix>\s*<\/CommonPrefixes>/g)) prefixes.push(xmlText(m[1]!));
      token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? xmlText(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/.exec(xml)?.[1] ?? "") || undefined : undefined;
    } while (token);
    return { keys, prefixes };
  }
}

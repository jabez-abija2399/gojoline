/**
 * Checks a connection before it is saved (Admin → Posts → Connections): asks the network for the
 * Page or account's name with the token given. Behind an interface so tests never call Meta.
 */
export interface ConnectionVerifier {
  /** The Page's name, or throws with Meta's reason. */
  facebook(pageId: string, token: string): Promise<string>;
  /** The Instagram username, or throws with Meta's reason. */
  instagram(userId: string, token: string): Promise<string>;
}

export class GraphVerifier implements ConnectionVerifier {
  constructor(
    private readonly version = "v23.0",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}
  private async get(path: string, token: string): Promise<Record<string, unknown>> {
    const res = await this.fetchImpl(`https://graph.facebook.com/${this.version}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
    const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { error?: { message?: string } }) | null;
    if (!res.ok || !d || d.error) throw new Error(d?.error?.message?.slice(0, 200) ?? `HTTP ${res.status}`);
    return d;
  }
  async facebook(pageId: string, token: string) {
    const d = await this.get(`${encodeURIComponent(pageId)}?fields=name`, token);
    return String(d.name ?? pageId);
  }
  async instagram(userId: string, token: string) {
    const d = await this.get(`${encodeURIComponent(userId)}?fields=username`, token);
    return String(d.username ?? userId);
  }
}

/** Dev and e2e: accepts the token "e2e-token-0123456789abcd" only. */
export class FakeVerifier implements ConnectionVerifier {
  async facebook(pageId: string, token: string) {
    if (token !== "e2e-token-0123456789abcd") throw new Error("Invalid OAuth access token.");
    return `Gojoline Page ${pageId}`;
  }
  async instagram(_userId: string, token: string) {
    if (token !== "e2e-token-0123456789abcd") throw new Error("Invalid OAuth access token.");
    return "gojoline";
  }
}

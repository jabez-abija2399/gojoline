/**
 * Checks a connection before it is saved (Admin → Posts → Connections): asks the network for the
 * Page or account's name with the token given. Behind an interface so tests never call Meta.
 */
export interface ConnectionVerifier {
  /** The Page's name, or throws with Meta's reason. */
  facebook(pageId: string, token: string): Promise<string>;
  /** The Instagram username, or throws with Meta's reason. */
  instagram(userId: string, token: string): Promise<string>;
  /** Instagram login (no Facebook Page): the account the token belongs to, or throws with Meta's reason. */
  instagramLogin(token: string): Promise<{ userId: string; username: string }>;
}

export class GraphVerifier implements ConnectionVerifier {
  constructor(
    private readonly version = "v23.0",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}
  private async get(path: string, token: string, host = "graph.facebook.com"): Promise<Record<string, unknown>> {
    const res = await this.fetchImpl(`https://${host}/${this.version}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
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
  async instagramLogin(token: string) {
    // `user_id` is the professional account's id, the one media is published to.
    const d = await this.get("me?fields=user_id,username", token, "graph.instagram.com");
    const userId = String(d.user_id ?? "");
    if (!/^\d{5,25}$/.test(userId)) throw new Error("This token isn't for an Instagram professional account.");
    return { userId, username: String(d.username ?? userId) };
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
  async instagramLogin(token: string) {
    if (token !== "e2e-token-0123456789abcd") throw new Error("Invalid OAuth access token.");
    return { userId: "17841400000000000", username: "gojoline" };
  }
}

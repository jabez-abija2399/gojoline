/**
 * Checks a connection before it is saved (Admin → Posts → Connections): asks the network for the
 * Page or account's name with the token given. Behind an interface so tests never call Meta.
 */
export interface ConnectionVerifier {
  /** The Page's name, or throws with Meta's reason. */
  facebook(pageId: string, token: string): Promise<string>;
  /** The Instagram username, or throws with Meta's reason. */
  instagram(userId: string, token: string): Promise<string>;
  /**
   * The Instagram account a token can post to, and through which host: an Instagram-login token
   * (graph.instagram.com, renewed every 60 days) or a Unified-login / business token
   * (graph.facebook.com, a system-user token that never expires). Throws with Meta's reason, or
   * with IG_ID_NEEDED when the token works but no account could be found (the admin gives its ID).
   */
  instagramToken(token: string, userId?: string): Promise<InstagramAccount>;
}

export type InstagramAccount = { userId: string; username: string; host: "instagram" | "facebook" };
export const IG_ID_NEEDED = "IG_ID_NEEDED";
const IG_ID = /^\d{5,25}$/;

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
  async instagramToken(token: string, userId?: string): Promise<InstagramAccount> {
    // 1. Instagram login (older apps): the token names its own professional account.
    let first: Error | null = null;
    if (!userId) {
      try {
        const d = await this.get("me?fields=user_id,username", token, "graph.instagram.com");
        const id = String(d.user_id ?? "");
        if (IG_ID.test(id)) return { userId: id, username: String(d.username ?? id), host: "instagram" };
      } catch (e) {
        first = e as Error;
      }
    }
    // 2. Unified login (new apps) or a Page token: graph.facebook.com, with the account given or found.
    if (userId) {
      const d = await this.get(`${encodeURIComponent(userId)}?fields=username`, token);
      return { userId, username: String(d.username ?? userId), host: "facebook" };
    }
    let found: string[] = [];
    try {
      // The token's own description lists the Instagram accounts it was granted (system-user tokens).
      const d = await this.get(`debug_token?input_token=${encodeURIComponent(token)}`, token);
      const scopes = ((d.data as { granular_scopes?: { scope?: string; target_ids?: string[] }[] } | undefined)?.granular_scopes ?? []);
      found = scopes.filter((g) => /^instagram_(content_publish|basic)$/.test(g.scope ?? "")).flatMap((g) => g.target_ids ?? []);
    } catch (e) {
      first ??= e as Error;
    }
    try {
      // A token with Pages: each Page's linked Instagram account.
      const d = await this.get("me/accounts?fields=instagram_business_account", token);
      for (const p of (d.data as { instagram_business_account?: { id?: string } }[] | undefined) ?? []) if (p.instagram_business_account?.id) found.push(p.instagram_business_account.id);
    } catch {
      // Not a token with Pages: fine.
    }
    for (const id of [...new Set(found)].filter((x) => IG_ID.test(x))) {
      try {
        const d = await this.get(`${id}?fields=username`, token);
        return { userId: id, username: String(d.username ?? id), host: "facebook" };
      } catch (e) {
        first ??= e as Error;
      }
    }
    // The token works on Facebook's side but names no account we could read: ask for the ID.
    const works = await this.get("me?fields=id", token).then(() => true, (e: Error) => ((first ??= e), false));
    throw works ? new Error(IG_ID_NEEDED) : (first ?? new Error("Invalid OAuth access token."));
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
  /** "e2e-token-…" is an Instagram-login token; "e2e-business-…" a business token that needs the ID. */
  async instagramToken(token: string, userId?: string): Promise<InstagramAccount> {
    if (token === "e2e-token-0123456789abcd") return { userId: "17841400000000000", username: "gojoline", host: "instagram" };
    if (token !== "e2e-business-0123456789abcd") throw new Error("Invalid OAuth access token.");
    if (!userId) throw new Error(IG_ID_NEEDED);
    return { userId, username: "gojoline", host: "facebook" };
  }
}

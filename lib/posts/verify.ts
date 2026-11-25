import { tokenHost } from "./connections";

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
/** A Facebook-side token that expires (a user token, not the business system-user token). */
export const IG_TOKEN_EXPIRES = "IG_TOKEN_EXPIRES";
const IG_ID = /^\d{5,25}$/;

export class GraphVerifier implements ConnectionVerifier {
  constructor(
    private readonly version = "v27.0",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}
  private async get(path: string, token: string, host = "graph.facebook.com", deadline?: AbortSignal): Promise<Record<string, unknown>> {
    const signal = deadline ? AbortSignal.any([deadline, AbortSignal.timeout(8_000)]) : AbortSignal.timeout(20_000);
    const res = await this.fetchImpl(`https://${host}/${this.version}/${path}`, { headers: { Authorization: `Bearer ${token}` }, signal });
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
    // One deadline for the whole check (8 s per call): the admin never waits more than ~25 s.
    const deadline = AbortSignal.timeout(25_000);
    const get = (path: string, host?: string) => this.get(path, token, host, deadline);
    // The first letters only hint at the token's kind (Meta's system-user tokens don't always start
    // with "EAA"), so both sides are tried, the hinted one first.
    const hint = tokenHost(token);

    // Facebook's side (Unified login / business, or a Page token). The token's own description says
    // whether it expires and which Instagram accounts it was granted.
    const viaFacebook = async (): Promise<InstagramAccount> => {
      const [dbg, pages] = await Promise.allSettled([get(`debug_token?input_token=${encodeURIComponent(token)}`), userId ? Promise.resolve<Record<string, unknown>>({}) : get("me/accounts?fields=instagram_business_account&limit=25")]);
      const info = dbg.status === "fulfilled" ? (dbg.value.data as { is_valid?: boolean; expires_at?: number; granular_scopes?: { scope?: string; target_ids?: string[] }[] } | undefined) : undefined;
      // Posting stops when a token runs out and these are never renewed: only a lasting token is kept.
      if (info?.is_valid !== false && typeof info?.expires_at === "number" && info.expires_at > 0) throw new Error(IG_TOKEN_EXPIRES);
      if (userId) {
        const d = await get(`${encodeURIComponent(userId)}?fields=username`);
        return { userId, username: String(d.username ?? userId), host: "facebook" };
      }
      // Accounts granted posting first, then reading; then any Page's linked account.
      const granted = (scope: string) => (info?.granular_scopes ?? []).filter((g) => g.scope === scope).flatMap((g) => g.target_ids ?? []);
      const found = [...granted("instagram_content_publish"), ...granted("instagram_basic")];
      if (pages.status === "fulfilled") for (const p of (pages.value.data as { instagram_business_account?: { id?: string } }[] | undefined) ?? []) if (p.instagram_business_account?.id) found.push(p.instagram_business_account.id);
      let first: Error | null = null;
      for (const id of [...new Set(found)].filter((x) => IG_ID.test(x)).slice(0, 5)) {
        try {
          const d = await get(`${id}?fields=username`);
          return { userId: id, username: String(d.username ?? id), host: "facebook" };
        } catch (e) {
          if (fatal(e as Error)) throw e;
          first ??= e as Error;
        }
      }
      // Nothing readable: if the token works here, ask for the account's ID; else give Meta's reason.
      const valid = info ? info.is_valid !== false : await get("me?fields=id").then(() => true, (e: Error) => ((first ??= e), false));
      if (valid) throw new Error(IG_ID_NEEDED);
      throw first ?? (dbg.status === "rejected" ? (dbg.reason as Error) : new Error("Invalid OAuth access token."));
    };

    // Instagram's side (Instagram login, older apps): the token names its own account.
    const viaInstagram = async (): Promise<InstagramAccount> => {
      if (userId) {
        const d = await get(`${encodeURIComponent(userId)}?fields=username`, "graph.instagram.com");
        return { userId, username: String(d.username ?? userId), host: "instagram" };
      }
      const d = await get("me?fields=user_id,username", "graph.instagram.com");
      const id = String(d.user_id ?? "");
      if (!IG_ID.test(id)) throw new Error("This token isn't for an Instagram professional account.");
      return { userId: id, username: String(d.username ?? id), host: "instagram" };
    };

    const [firstTry, secondTry] = hint === "instagram" ? [viaInstagram, viaFacebook] : [viaFacebook, viaInstagram];
    try {
      return await firstTry();
    } catch (e) {
      const err = e as Error;
      // Answers that settle it: a lasting-token problem, a needed ID, or the time ran out.
      if (err.message === IG_TOKEN_EXPIRES || err.message === IG_ID_NEEDED || err.name === "TimeoutError" || deadline.aborted) throw err;
      try {
        return await secondTry();
      } catch (e2) {
        const err2 = e2 as Error;
        // The other side recognised the token (it needs an ID or is the wrong kind): that answer helps more.
        if (err2.message === IG_TOKEN_EXPIRES || err2.message === IG_ID_NEEDED) throw err2;
        throw err;
      }
    }
  }
}

/** A refused token or the deadline: trying more accounts can't help. */
function fatal(e: Error): boolean {
  return e.name === "TimeoutError" || e.name === "AbortError" || /oauth|access token|session has expired/i.test(e.message);
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

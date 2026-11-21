/**
 * "Connect TikTok" (Admin → Posts): TikTok's sign-in for our own account, once. The refresh token
 * it returns is kept in the database (app_settings "posts.tiktok"); the publisher uses and renews it.
 */
export const TIKTOK_SCOPES = "user.info.basic,video.upload";

export function tiktokRedirectUri(appUrl: string): string {
  return `${appUrl}/api/admin/tiktok/callback`;
}

export function tiktokAuthorizeUrl(clientKey: string, appUrl: string, state: string): string {
  const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
  u.searchParams.set("client_key", clientKey);
  u.searchParams.set("scope", TIKTOK_SCOPES);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", tiktokRedirectUri(appUrl));
  u.searchParams.set("state", state);
  return u.toString();
}

/** Trades the one-time code for tokens; returns the refresh token (or throws with TikTok's reason). */
export async function tiktokExchange(input: { clientKey: string; clientSecret: string; code: string; appUrl: string }, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: input.clientKey, client_secret: input.clientSecret, code: input.code, grant_type: "authorization_code", redirect_uri: tiktokRedirectUri(input.appUrl) }),
    signal: AbortSignal.timeout(30_000),
  });
  const d = (await res.json().catch(() => null)) as { refresh_token?: string; error_description?: string } | null;
  if (!res.ok || !d?.refresh_token) throw new Error(`TikTok: ${d?.error_description?.slice(0, 120) ?? res.status}`);
  return d.refresh_token;
}

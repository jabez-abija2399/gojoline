/**
 * Instagram login tokens last 60 days. Renewing one gives a fresh 60 days; Meta allows it once the
 * token is a day old. We renew when it is a week old, before posting, so it never runs out while
 * posts keep going out. A failed renewal keeps the old token (it still works until it expires).
 */
export const RENEW_AFTER_MS = 7 * 86_400_000;

export function needsRenewal(refreshedAt: string | undefined, now: number): boolean {
  const t = refreshedAt ? Date.parse(refreshedAt) : NaN;
  return !Number.isFinite(t) || now - t >= RENEW_AFTER_MS;
}

/** Asks Instagram for a renewed token; throws with Meta's reason (never the token). */
export async function renewInstagramToken(token: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`;
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(20_000) });
  const d = (await res.json().catch(() => null)) as { access_token?: string; error?: { message?: string } } | null;
  if (!res.ok || !d?.access_token) throw new Error(d?.error?.message?.slice(0, 200) ?? `HTTP ${res.status}`);
  return d.access_token;
}

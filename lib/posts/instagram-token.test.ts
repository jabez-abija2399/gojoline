import { describe, expect, it } from "vitest";
import { GraphVerifier, IG_ID_NEEDED, IG_TOKEN_EXPIRES } from "./verify";
import { needsRenewal, renewInstagramToken } from "./instagram-token";

const now = Date.parse("2026-11-24T12:00:00Z");
const answer = (status: number, json: unknown) => (async () => new Response(JSON.stringify(json), { status })) as unknown as typeof fetch;

describe("Instagram login token", () => {
  it("is renewed once a week old, or when its age is unknown", () => {
    expect(needsRenewal("2026-11-20T12:00:00Z", now)).toBe(false);
    expect(needsRenewal("2026-11-17T12:00:00Z", now)).toBe(true);
    expect(needsRenewal(undefined, now)).toBe(true);
    expect(needsRenewal("not a date", now)).toBe(true);
    // After a failed try: wait an hour, then try again.
    expect(needsRenewal("2026-11-10T12:00:00Z", now, "2026-11-24T11:30:00Z")).toBe(false);
    expect(needsRenewal("2026-11-10T12:00:00Z", now, "2026-11-24T10:59:00Z")).toBe(true);
  });

  it("renewal returns the new token, or Meta's reason without the token", async () => {
    let asked = "";
    const ok = (async (url: string | URL) => { asked = String(url); return new Response(JSON.stringify({ access_token: "IGAA-new", expires_in: 5184000 })); }) as typeof fetch;
    expect(await renewInstagramToken("IGAA-old", ok)).toBe("IGAA-new");
    expect(asked).toContain("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token");
    const err = await renewInstagramToken("IGAA-old", answer(400, { error: { message: "Session has expired" } })).catch((e: Error) => e.message);
    expect(err).toBe("Session has expired");
    expect(err).not.toContain("IGAA");
  });

});

/** A fake Meta: answers by address; anything else is a token error. */
function meta(routes: Record<string, unknown>) {
  const asked: string[] = [];
  const f = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    asked.push(u);
    expect((init?.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
    const hit = Object.entries(routes).find(([k]) => u.includes(k));
    return hit ? new Response(JSON.stringify(hit[1])) : new Response(JSON.stringify({ error: { message: "Invalid OAuth access token." } }), { status: 400 });
  }) as typeof fetch;
  return { f, asked };
}

describe("finding the Instagram account from a token", () => {
  it("an Instagram-login token names its own account (graph.instagram.com)", async () => {
    const m = meta({ "graph.instagram.com/v23.0/me?fields=user_id,username": { id: "app-scoped", user_id: "17841400000000000", username: "gojoline" } });
    expect(await new GraphVerifier("v23.0", m.f).instagramToken("IGAA-tok")).toEqual({ userId: "17841400000000000", username: "gojoline", host: "instagram" });
  });

  it("a Unified-login (business) token: the account comes from the token's own grants (graph.facebook.com)", async () => {
    const m = meta({
      "graph.facebook.com/v23.0/debug_token": { data: { granular_scopes: [{ scope: "ads_read", target_ids: ["999999"] }, { scope: "instagram_content_publish", target_ids: ["17841411111111111"] }] } },
      "graph.facebook.com/v23.0/17841411111111111?fields=username": { username: "gojoline", id: "17841411111111111" },
    });
    expect(await new GraphVerifier("v23.0", m.f).instagramToken("EAAB-system")).toEqual({ userId: "17841411111111111", username: "gojoline", host: "facebook" });
    expect(m.asked.some((u) => u.includes("999999"))).toBe(false);
  });

  it("a Page token: the Page's linked Instagram account", async () => {
    const m = meta({
      "debug_token": { data: { granular_scopes: [] } },
      "me/accounts?fields=instagram_business_account": { data: [{ id: "page1" }, { id: "page2", instagram_business_account: { id: "17841422222222222" } }] },
      "17841422222222222?fields=username": { username: "shop" },
    });
    expect(await new GraphVerifier("v23.0", m.f).instagramToken("EAAB-page")).toEqual({ userId: "17841422222222222", username: "shop", host: "facebook" });
  });

  it("a working token with no account it can name asks for the ID; with the ID it connects", async () => {
    const m = meta({ "debug_token": { data: {} }, "graph.facebook.com/v23.0/me?fields=id": { id: "sys" }, "17841433333333333?fields=username": { username: "gojoline" } });
    await expect(new GraphVerifier("v23.0", m.f).instagramToken("EAAB-system")).rejects.toThrow(IG_ID_NEEDED);
    expect(await new GraphVerifier("v23.0", m.f).instagramToken("EAAB-system", "17841433333333333")).toEqual({ userId: "17841433333333333", username: "gojoline", host: "facebook" });
  });

  it("tries at most 5 granted accounts, and stops at once when the token itself is refused", async () => {
    const ids = Array.from({ length: 30 }, (_, i) => String(17841400000000100 + i));
    const unreadable = meta({ "debug_token": { data: { is_valid: true, granular_scopes: [{ scope: "instagram_basic", target_ids: ids }] } } });
    await expect(new GraphVerifier("v23.0", unreadable.f).instagramToken("EAAB-system")).rejects.toThrow("Invalid OAuth access token.");
    // The token error from the first lookup ends the search.
    expect(unreadable.asked.filter((u) => u.includes("?fields=username"))).toHaveLength(1);
    let lookups = 0;
    const notFound = (async (url: string | URL) => {
      const u = String(url);
      if (u.includes("debug_token")) return new Response(JSON.stringify({ data: { is_valid: true, granular_scopes: [{ scope: "instagram_basic", target_ids: ids }] } }));
      if (u.includes("?fields=username")) lookups++;
      return new Response(JSON.stringify({ error: { message: "Unsupported get request." } }), { status: 400 });
    }) as typeof fetch;
    await expect(new GraphVerifier("v23.0", notFound).instagramToken("EAAB-system")).rejects.toThrow(IG_ID_NEEDED);
    expect(lookups).toBe(5);
  });

  it("a token refused on both sides gives the hinted side's reason, trying the hinted side first", async () => {
    const m = meta({});
    await expect(new GraphVerifier("v23.0", m.f).instagramToken("IGAA-expired")).rejects.toThrow("Invalid OAuth access token.");
    expect(m.asked[0]).toBe("https://graph.instagram.com/v23.0/me?fields=user_id,username");
    expect(m.asked.some((u) => u.includes("graph.facebook.com"))).toBe(true);
  });

  it("a system-user token whose first letters aren't EAA still connects through Facebook's side, with the ID", async () => {
    const m = meta({
      "graph.facebook.com/v23.0/debug_token": { data: { is_valid: true, expires_at: 0, granular_scopes: [{ scope: "instagram_content_publish" }] } },
      "graph.facebook.com/v23.0/17841452936927432?fields=username": { username: "gojoline", id: "17841452936927432" },
    });
    expect(await new GraphVerifier("v23.0", m.f).instagramToken("XYZ-system-user-token", "17841452936927432")).toEqual({ userId: "17841452936927432", username: "gojoline", host: "facebook" });
  });

  it("without the ID, a working system-user token whose grants apply to all objects asks for the ID", async () => {
    const m = meta({ "graph.facebook.com/v23.0/debug_token": { data: { is_valid: true, expires_at: 0, granular_scopes: [{ scope: "instagram_content_publish" }] } } });
    await expect(new GraphVerifier("v23.0", m.f).instagramToken("XYZ-system-user-token")).rejects.toThrow(IG_ID_NEEDED);
  });

  it("an Instagram-login token with an ID is checked on Instagram's side when Facebook's refuses it", async () => {
    const m = meta({ "graph.instagram.com/v23.0/17841400000000000?fields=username": { username: "gojoline" } });
    expect(await new GraphVerifier("v23.0", m.f).instagramToken("IGAA-tok", "17841400000000000")).toEqual({ userId: "17841400000000000", username: "gojoline", host: "instagram" });
  });

  it("refuses a Facebook-side token that expires (only lasting business tokens are kept), and tries posting accounts first", async () => {
    const expiring = meta({ "debug_token": { data: { is_valid: true, expires_at: 1_800_000_000, granular_scopes: [{ scope: "instagram_content_publish", target_ids: ["17841455555555555"] }] } } });
    await expect(new GraphVerifier("v23.0", expiring.f).instagramToken("EAAB-user")).rejects.toThrow(IG_TOKEN_EXPIRES);
    await expect(new GraphVerifier("v23.0", expiring.f).instagramToken("EAAB-user", "17841455555555555")).rejects.toThrow(IG_TOKEN_EXPIRES);
    const order = meta({
      "debug_token": { data: { is_valid: true, expires_at: 0, granular_scopes: [{ scope: "instagram_basic", target_ids: ["17841466666666666"] }, { scope: "instagram_content_publish", target_ids: ["17841477777777777"] }] } },
      "?fields=username": { username: "poster" },
    });
    expect((await new GraphVerifier("v23.0", order.f).instagramToken("EAAB-system")).userId).toBe("17841477777777777");
  });

  it("a token that works nowhere gives Meta's reason", async () => {
    await expect(new GraphVerifier("v23.0", meta({}).f).instagramToken("bad-token-0123456789")).rejects.toThrow("Invalid OAuth access token.");
  });
});

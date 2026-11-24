import { describe, expect, it } from "vitest";
import { GraphVerifier } from "./verify";
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

  it("the verifier finds the professional account from the token alone", async () => {
    let asked = "";
    const f = (async (url: string | URL, init?: RequestInit) => {
      asked = String(url);
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer IGAA-tok");
      return new Response(JSON.stringify({ id: "app-scoped", user_id: "17841400000000000", username: "gojoline" }));
    }) as typeof fetch;
    expect(await new GraphVerifier("v23.0", f).instagramLogin("IGAA-tok")).toEqual({ userId: "17841400000000000", username: "gojoline" });
    expect(asked).toBe("https://graph.instagram.com/v23.0/me?fields=user_id,username");
    await expect(new GraphVerifier("v23.0", answer(200, { id: "x", username: "someone" })).instagramLogin("IGAA-tok")).rejects.toThrow("professional account");
  });
});

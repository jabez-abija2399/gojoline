import { describe, expect, it } from "vitest";
import { MemorySettingsStore } from "@/lib/billing/settings";
import { seal, unseal } from "@/lib/security/seal";
import { ConnectionStore } from "./connections";

const SECRET = "test-server-secret-0123456789abcdefghij";

describe("seal", () => {
  it("opens only with the same secret, and never stores the plain text", () => {
    const s = seal("EAAB-page-token", SECRET);
    expect(s.startsWith("v1.")).toBe(true);
    expect(s).not.toContain("EAAB");
    expect(unseal(s, SECRET)).toBe("EAAB-page-token");
    expect(unseal(s, "another-secret-0123456789abcdefghijklmn")).toBeNull();
    expect(unseal(s.replace(/.$/, s.endsWith("A") ? "B" : "A"), SECRET)).toBeNull();
    expect(unseal("plain", SECRET)).toBeNull();
  });
});

describe("ConnectionStore", () => {
  it("keeps tokens sealed, shows only labels, and falls back to the server's settings", async () => {
    const settings = new MemorySettingsStore();
    const store = new ConnectionStore(settings, SECRET, { TELEGRAM_CHANNEL_ID: "@from_server" });
    expect((await store.view()).telegram).toEqual({ connected: true, label: "@from_server", source: "server" });
    expect((await store.view()).facebook.connected).toBe(false);

    await store.saveTelegram("@gojoline", "admin");
    await store.saveFacebook({ pageId: "123456", token: "EAAB-secret", name: "Gojoline" }, "admin");
    await store.saveInstagram({ userId: "178414", username: "gojoline" }, "admin");
    const raw = JSON.stringify(await settings.get("posts.connections"));
    expect(raw).not.toContain("EAAB-secret");
    expect((await store.load()).facebook).toEqual({ pageId: "123456", token: "EAAB-secret", name: "Gojoline" });
    const view = await store.view();
    expect(view.telegram).toEqual({ connected: true, label: "@gojoline", source: "admin" });
    expect(view.facebook).toEqual({ connected: true, label: "Gojoline", source: "admin" });
    expect(view.instagram).toMatchObject({ connected: true, label: "@gojoline" });
    expect(JSON.stringify(view)).not.toContain("EAAB");

    // TikTok: the app first, then the sign-in finishes it.
    await store.saveTikTokApp({ clientKey: "awkey", clientSecret: "tiktok-secret-1" }, "admin");
    expect((await store.view()).tiktok).toMatchObject({ connected: false, needsSignIn: true });
    await store.saveTikTokToken("rft.1", "admin");
    expect((await store.load()).tiktok).toEqual({ clientKey: "awkey", clientSecret: "tiktok-secret-1", refreshToken: "rft.1" });
    expect((await store.view()).tiktok.connected).toBe(true);

    // Disconnecting Facebook also stops Instagram (it posts with the Page's token).
    await store.remove("facebook", "admin");
    expect((await store.view()).facebook.connected).toBe(false);
    expect((await store.view()).instagram.connected).toBe(false);
    await store.remove("telegram", "admin");
    expect((await store.view()).telegram.source).toBe("server");
  });

  it("Instagram login: connected without Facebook, token sealed, renewed in place, and a save without a token drops it", async () => {
    const settings = new MemorySettingsStore();
    const store = new ConnectionStore(settings, SECRET);
    await store.saveInstagram({ userId: "17841400000000000", username: "gojoline", token: "IGAA-secret-token" }, "admin", new Date("2026-11-24T10:00:00Z"));
    expect(JSON.stringify(await settings.get("posts.connections"))).not.toContain("IGAA-secret");
    expect((await store.load()).instagram).toEqual({ userId: "17841400000000000", username: "gojoline", token: "IGAA-secret-token", refreshedAt: "2026-11-24T10:00:00.000Z", renewTriedAt: undefined });
    const view = await store.view();
    expect(view.facebook.connected).toBe(false);
    expect(view.instagram).toEqual({ connected: true, label: "@gojoline", source: "admin" });
    expect(JSON.stringify(view)).not.toContain("IGAA");

    // A failed try is remembered; a later success clears it.
    await store.saveInstagramRenewFailure("IGAA-secret-token", "system", new Date("2026-12-01T09:00:00Z"));
    expect((await store.load()).instagram?.renewTriedAt).toBe("2026-12-01T09:00:00.000Z");
    expect(await store.saveInstagramToken("IGAA-secret-token", "IGAA-renewed", "system", new Date("2026-12-01T10:00:00Z"))).toBe(true);
    expect((await store.load()).instagram).toEqual({ userId: "17841400000000000", username: "gojoline", token: "IGAA-renewed", refreshedAt: "2026-12-01T10:00:00.000Z", renewTriedAt: undefined });

    // A renewal that started before a reconnect never overwrites the new account's token.
    await store.saveInstagram({ userId: "17841499999999999", username: "other", token: "IGAA-other" }, "admin");
    expect(await store.saveInstagramToken("IGAA-renewed", "IGAA-stale", "system")).toBe(false);
    await store.saveInstagramRenewFailure("IGAA-renewed", "system");
    expect((await store.load()).instagram).toMatchObject({ userId: "17841499999999999", token: "IGAA-other", username: "other" });
    expect((await store.load()).instagram?.renewTriedAt).toBeUndefined();

    await store.saveInstagram({ userId: "17841400000000000", username: "gojoline" }, "admin");
    expect((await store.load()).instagram?.token).toBeUndefined();
    expect((await store.view()).instagram.connected).toBe(false);
  });

  it("Instagram login from the server's settings (INSTAGRAM_TOKEN), and no renewal for a token not saved here", async () => {
    const store = new ConnectionStore(new MemorySettingsStore(), SECRET, { INSTAGRAM_USER_ID: "1784", INSTAGRAM_TOKEN: "IGAA-env" });
    expect((await store.load()).instagram).toEqual({ userId: "1784", username: undefined, token: "IGAA-env", refreshedAt: undefined, renewTriedAt: undefined });
    expect((await store.view()).instagram).toMatchObject({ connected: true, source: "server" });
    expect(await store.saveInstagramToken("IGAA-env", "IGAA-new", "system")).toBe(false);
    expect((await store.load()).instagram?.token).toBe("IGAA-env");
  });
});

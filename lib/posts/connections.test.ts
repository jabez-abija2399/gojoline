import { describe, expect, it } from "vitest";
import { MemorySettingsStore } from "@/lib/billing/settings";
import { seal, unseal } from "@/lib/security/seal";
import { ConnectionStore } from "./connections";

const SECRET = "test-server-secret-0123456789";

describe("seal", () => {
  it("opens only with the same secret, and never stores the plain text", () => {
    const s = seal("EAAB-page-token", SECRET);
    expect(s.startsWith("v1.")).toBe(true);
    expect(s).not.toContain("EAAB");
    expect(unseal(s, SECRET)).toBe("EAAB-page-token");
    expect(unseal(s, "another-secret-0123456789")).toBeNull();
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
});

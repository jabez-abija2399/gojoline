import { describe, expect, it } from "vitest";
import { checkTikTokState, newTikTokState } from "./tiktok-state";

describe("TikTok OAuth state", () => {
  it("is accepted only with the same cookie and the same admin", () => {
    const { nonce, state } = newTikTokState("s".repeat(32), "admin-1");
    expect(checkTikTokState("s".repeat(32), "admin-1", nonce, state)).toBe(true);
    expect(checkTikTokState("s".repeat(32), "admin-2", nonce, state)).toBe(false);
    expect(checkTikTokState("s".repeat(32), "admin-1", "other", state)).toBe(false);
    expect(checkTikTokState("s".repeat(32), "admin-1", undefined, state)).toBe(false);
    expect(checkTikTokState("s".repeat(32), "admin-1", nonce, nonce)).toBe(false);
    expect(checkTikTokState("t".repeat(32), "admin-1", nonce, state)).toBe(false);
  });
});

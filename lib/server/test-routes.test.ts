import { describe, expect, it } from "vitest";
import { testRoutesOpen } from "./test-routes";

describe("testRoutesOpen", () => {
  it("needs the explicit E2E flag, also in a production build", () => {
    expect(testRoutesOpen({ E2E: "1", NODE_ENV: "production" })).toBe(true);
    expect(testRoutesOpen({ NODE_ENV: "production" })).toBe(false);
    expect(testRoutesOpen({ E2E: "true" })).toBe(false);
  });
  it("never on Vercel, and not with a real database unless allowed", () => {
    expect(testRoutesOpen({ E2E: "1", VERCEL: "1" })).toBe(false);
    expect(testRoutesOpen({ E2E: "1", DATABASE_URL: "postgres://x" })).toBe(false);
    expect(testRoutesOpen({ E2E: "1", DATABASE_URL: "postgres://x" }, { allowDatabase: true })).toBe(true);
  });
});

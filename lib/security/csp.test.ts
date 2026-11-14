import { describe, expect, it } from "vitest";
import { buildCsp, createNonce, cspFromEnv } from "./csp";

describe("CSP", () => {
  it("is strict in production", () => {
    const csp = buildCsp({ nonce: "abc", isDev: false });
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows eval only in development", () => {
    expect(buildCsp({ nonce: "n", isDev: true })).toContain("'unsafe-eval'");
  });

  it("only accepts https origins from env", () => {
    const csp = cspFromEnv("n", {
      NODE_ENV: "production",
      CSP_FRAME_ORIGINS: "https://*.vercel.run, javascript:alert(1) http://evil.test",
    } as NodeJS.ProcessEnv);
    expect(csp).toContain("frame-src https://*.vercel.run;");
    expect(csp).not.toContain("evil");
    expect(csp).not.toContain("javascript");
  });

  it("nonces are unique and 128-bit", () => {
    const a = createNonce();
    expect(a).not.toBe(createNonce());
    expect(atob(a)).toHaveLength(16);
  });
});

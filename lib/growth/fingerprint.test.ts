import { describe, expect, it } from "vitest";
import { networkOf, signupHashes } from "./fingerprint";

describe("signup hashes", () => {
  it("keeps IPv4 whole and IPv6 to its /64", () => {
    expect(networkOf("196.188.1.2")).toBe("196.188.1.2");
    expect(networkOf("2001:db8:1:2:3:4:5:6")).toBe("2001:db8:1:2::/64");
    expect(networkOf("unknown")).toBeNull();
  });
  it("hashes with the secret, never storing the address", () => {
    const a = signupHashes({ ip: "196.188.1.2", userAgent: "UA" }, "s1");
    expect(a.ipHash).toMatch(/^[0-9a-f]{32}$/);
    expect(a.ipHash).not.toContain("196");
    expect(signupHashes({ ip: "196.188.1.2", userAgent: "UA" }, "s1")).toEqual(a);
    expect(signupHashes({ ip: "196.188.1.2", userAgent: "UA" }, "s2").ipHash).not.toBe(a.ipHash);
    expect(signupHashes({ ip: "2001:db8:1:2::9", userAgent: null }, "s1")).toEqual({ ipHash: signupHashes({ ip: "2001:db8:1:2:ffff::1", userAgent: null }, "s1").ipHash, deviceHash: null });
  });
});

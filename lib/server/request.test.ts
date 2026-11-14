import { describe, expect, it } from "vitest";
import { ipFromHeaders } from "./request";

describe("ipFromHeaders", () => {
  it("prefers the platform x-real-ip", () => {
    expect(ipFromHeaders(new Headers({ "x-real-ip": "1.2.3.4", "x-forwarded-for": "6.6.6.6" }))).toBe("1.2.3.4");
  });
  it("ignores the spoofable leftmost forwarded hop", () => {
    expect(ipFromHeaders(new Headers({ "x-forwarded-for": "6.6.6.6, 10.0.0.1" }))).toBe("10.0.0.1");
  });
  it("falls back to unknown", () => {
    expect(ipFromHeaders(new Headers())).toBe("unknown");
  });
});

import { describe, expect, it } from "vitest";
import { shortAgent } from "./agent";

describe("shortAgent", () => {
  it("names the browser and the system", () => {
    expect(shortAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36")).toBe("Chrome · Android");
    expect(shortAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe("Safari · iOS");
    expect(shortAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0")).toBe("Edge · Windows");
    expect(shortAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:130.0) Gecko/20100101 Firefox/130.0")).toBe("Firefox · macOS");
    expect(shortAgent("Mozilla/5.0 (Linux; Android 13; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36")).toBe("Samsung Internet · Android");
  });
  it("falls back to what it knows", () => {
    expect(shortAgent(null)).toBeNull();
    expect(shortAgent("curl/8.5.0")).toBe("curl/8.5.0");
  });
});

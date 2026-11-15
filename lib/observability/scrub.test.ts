import { describe, expect, it } from "vitest";
import { scrubUrl } from "./scrub";

describe("scrubUrl", () => {
  it("removes bot tokens, long secrets and query strings", () => {
    expect(scrubUrl("https://api.telegram.org/bot123456:AAH-secret_token/sendMessage")).toBe("https://api.telegram.org/bot[redacted]/sendMessage");
    expect(scrubUrl("https://api.telegram.org/file/bot123:abc/photos/x.jpg")).toBe("https://api.telegram.org/file/bot[redacted]/photos/x.jpg");
    expect(scrubUrl("https://x.example/api/a?to=me@example.com")).toBe("https://x.example/api/a");
    expect(scrubUrl("https://x.example/v/abcdefghijklmnopqrstuvwxyz0123456789")).toBe("https://x.example/v/[redacted]");
  });
});

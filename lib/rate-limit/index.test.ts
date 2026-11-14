import { describe, expect, it } from "vitest";
import { MemoryRateLimiter } from ".";

describe("MemoryRateLimiter", () => {
  it("allows up to the limit, then blocks until the window resets", async () => {
    let now = 1_000;
    const limiter = new MemoryRateLimiter(() => now);
    for (let i = 0; i < 3; i++) expect((await limiter.hit("k", 3, 60_000)).allowed).toBe(true);
    expect((await limiter.hit("k", 3, 60_000)).allowed).toBe(false);
    expect((await limiter.hit("other", 3, 60_000)).allowed).toBe(true);
    now += 60_001;
    expect((await limiter.hit("k", 3, 60_000)).allowed).toBe(true);
  });
});

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { RateLimiter, RateLimitResult } from ".";

/** Shared rate limiter across all server instances (Upstash Redis, sliding window). */
export class UpstashRateLimiter implements RateLimiter {
  private limiters = new Map<string, Ratelimit>();
  constructor(private redis: Redis) {}

  async hit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const id = `${limit}:${windowMs}`;
    let limiter = this.limiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: "gojo:rl",
      });
      this.limiters.set(id, limiter);
    }
    const res = await limiter.limit(key);
    return { allowed: res.success, remaining: res.remaining, resetAt: res.reset };
  }
}

/** Refuses everything: used in production when no shared limiter is configured (fail closed). */
export class DenyAllRateLimiter implements RateLimiter {
  async hit(): Promise<RateLimitResult> {
    return { allowed: false, remaining: 0, resetAt: Date.now() + 60_000 };
  }
}

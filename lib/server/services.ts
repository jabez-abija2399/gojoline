import "server-only";
import { Redis } from "@upstash/redis";
import { MemoryRateLimiter, type RateLimiter } from "@/lib/rate-limit";
import { DenyAllRateLimiter, UpstashRateLimiter } from "@/lib/rate-limit/upstash";
import { MemoryWaitlistStore, type WaitlistStore } from "@/lib/waitlist/store";

// Single place that picks service implementations from the environment.
function pickRateLimiter(env: NodeJS.ProcessEnv): RateLimiter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRateLimiter(
      new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }),
    );
  }
  // Per-instance memory limits are no real limit on serverless: fail closed in production.
  if (env.NODE_ENV === "production" && env.VERCEL === "1") {
    console.error("Rate limiter not configured: set UPSTASH_REDIS_REST_URL/TOKEN");
    return new DenyAllRateLimiter();
  }
  return new MemoryRateLimiter();
}

const globalForServices = globalThis as unknown as {
  gojoServices?: { waitlist: WaitlistStore; rateLimiter: RateLimiter };
};

export function services() {
  globalForServices.gojoServices ??= {
    waitlist: new MemoryWaitlistStore(),
    rateLimiter: pickRateLimiter(process.env),
  };
  return globalForServices.gojoServices;
}

import "server-only";
import { MemoryRateLimiter, type RateLimiter } from "@/lib/rate-limit";
import { MemoryWaitlistStore, type WaitlistStore } from "@/lib/waitlist/store";

// Single place that picks service implementations from the environment.
// Later slices swap in Postgres / Upstash implementations here.
const globalForServices = globalThis as unknown as {
  gojoServices?: { waitlist: WaitlistStore; rateLimiter: RateLimiter };
};

export function services() {
  globalForServices.gojoServices ??= {
    waitlist: new MemoryWaitlistStore(),
    rateLimiter: new MemoryRateLimiter(),
  };
  return globalForServices.gojoServices;
}

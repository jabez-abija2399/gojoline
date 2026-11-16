import { createHash } from "node:crypto";
import type { RateLimiter } from "@/lib/rate-limit";

/** A first, cheap limit per address before any database read on public routes (the address is hashed). */
export async function ipAllowed(limiter: RateLimiter, route: string, ip: string, perMinute: number): Promise<boolean> {
  const key = createHash("sha256").update(`gojo-ip:${ip}`).digest("hex").slice(0, 24);
  return (await limiter.hit(`${route}:ip:${key}`, perMinute, 60_000)).allowed;
}

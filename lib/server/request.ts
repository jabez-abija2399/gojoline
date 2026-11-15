import "server-only";
import { headers } from "next/headers";

/**
 * Client IP for rate limiting. Uses headers set by the platform, never the client-controlled
 * leftmost X-Forwarded-For entry: Vercel sets `x-real-ip`; otherwise take the rightmost XFF hop
 * (added by our own edge). Returns "unknown" when neither exists.
 */
export function ipFromHeaders(h: Headers): string {
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return hops.at(-1) ?? "unknown";
}

export async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

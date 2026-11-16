import "server-only";
import { z } from "zod";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

/** An optional discount code as typed: empty, or letters and digits (any case, spaces trimmed). */
export const discountCodeField = z
  .string()
  .trim()
  .max(40)
  .transform((c) => c.toUpperCase())
  .refine((c) => c === "" || /^[A-Z0-9]{1,20}$/.test(c));

/** Guessing codes is slow: 20 tries an hour per owner and 60 per network address. */
export async function codeAttemptAllowed(userId: string): Promise<boolean> {
  const limiter = services().rateLimiter;
  const [byUser, byIp] = await Promise.all([limiter.hit(`discount:o:${userId}`, 20, 3_600_000), limiter.hit(`discount:ip:${await clientIp()}`, 60, 3_600_000)]);
  return byUser.allowed && byIp.allowed;
}

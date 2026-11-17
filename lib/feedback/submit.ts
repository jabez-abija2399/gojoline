import type { RateLimiter } from "@/lib/rate-limit";
import { parseFeedback } from "./schema";
import { PER_IP_HOUR, PER_OWNER_HOUR, type Feedback, type FeedbackStore } from "./types";

export type SubmitResult = { ok: true; feedback: Feedback } | { ok: false; error: "too_many" | "type" | "message" | "rating" | "locale" | "screenshot" };

/** Counts the attempt against the owner and the network first, then validates and saves. */
export async function submitFeedback(
  deps: { store: FeedbackStore; limiter: RateLimiter },
  input: { ownerId: string; network: string; fields: Record<string, unknown>; userAgent: string | null; screenshot: () => Promise<Buffer | null | "invalid"> },
): Promise<SubmitResult> {
  const [byOwner, byIp] = await Promise.all([
    deps.limiter.hit(`fb:o:${input.ownerId}`, PER_OWNER_HOUR, 3_600_000),
    deps.limiter.hit(`fb:ip:${input.network}`, PER_IP_HOUR, 3_600_000),
  ]);
  if (!byOwner.allowed || !byIp.allowed) return { ok: false, error: "too_many" };
  const parsed = parseFeedback(input.fields, input.userAgent);
  if (!parsed.ok) return { ok: false, error: parsed.field };
  // The photo is decoded only after the limits and the text passed (decoding costs the most).
  const shot = await input.screenshot();
  if (shot === "invalid") return { ok: false, error: "screenshot" };
  return { ok: true, feedback: await deps.store.add(input.ownerId, parsed.data, shot) };
}

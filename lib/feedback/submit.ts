import type { RateLimiter } from "@/lib/rate-limit";
import { parseFeedback } from "./schema";
import { PER_IP_HOUR, PER_OWNER_DAY, PER_OWNER_HOUR, SHOT_BYTES_DAY, SHOT_BYTES_TOTAL, type Feedback, type FeedbackStore } from "./types";

export type SubmitError = "too_many" | "type" | "message" | "rating" | "locale" | "screenshot" | "screenshot_unverified" | "screenshot_quota";
export type SubmitResult = { ok: true; feedback: Feedback } | { ok: false; error: SubmitError };

type Shot = { full: Buffer; thumb: Buffer };

/**
 * Counts the attempt against the owner (hour and day) and the network first, then validates the
 * text, then the screenshot: verified owners only, within the storage caps, decoded last.
 */
export async function submitFeedback(
  deps: { store: FeedbackStore; limiter: RateLimiter; now?: () => number },
  input: { ownerId: string; verified: boolean; network: string; fields: Record<string, unknown>; userAgent: string | null; hasScreenshot: boolean; screenshot: () => Promise<Shot | "invalid"> },
): Promise<SubmitResult> {
  const [hour, day, byIp] = await Promise.all([
    deps.limiter.hit(`fb:o:${input.ownerId}`, PER_OWNER_HOUR, 3_600_000),
    deps.limiter.hit(`fb:od:${input.ownerId}`, PER_OWNER_DAY, 86_400_000),
    deps.limiter.hit(`fb:ip:${input.network}`, PER_IP_HOUR, 3_600_000),
  ]);
  if (!hour.allowed || !day.allowed || !byIp.allowed) return { ok: false, error: "too_many" };
  const parsed = parseFeedback(input.fields, input.userAgent);
  if (!parsed.ok) return { ok: false, error: parsed.field };
  let shot: Shot | null = null;
  if (input.hasScreenshot) {
    // Stored pictures cost database space: only owners who confirmed their email or phone may add them.
    if (!input.verified) return { ok: false, error: "screenshot_unverified" };
    const since = new Date((deps.now ?? Date.now)() - 86_400_000);
    const [total, today] = await Promise.all([deps.store.screenshotBytes(input.ownerId, null), deps.store.screenshotBytes(input.ownerId, since)]);
    if (total >= SHOT_BYTES_TOTAL || today >= SHOT_BYTES_DAY) return { ok: false, error: "screenshot_quota" };
    const processed = await input.screenshot();
    if (processed === "invalid") return { ok: false, error: "screenshot" };
    if (total + processed.full.length > SHOT_BYTES_TOTAL || today + processed.full.length > SHOT_BYTES_DAY) return { ok: false, error: "screenshot_quota" };
    shot = processed;
  }
  return { ok: true, feedback: await deps.store.add(input.ownerId, parsed.data, shot) };
}

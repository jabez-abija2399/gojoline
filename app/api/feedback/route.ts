import { json } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/builder/access";
import { ipBucket } from "@/lib/cloud/submit";
import { processScreenshot } from "@/lib/feedback/image";
import { submitFeedback } from "@/lib/feedback/submit";
import { MAX_SCREENSHOT_BYTES } from "@/lib/feedback/types";
import { reportError } from "@/lib/observability/report";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";
import { headers } from "next/headers";

/** An owner sends feedback (multipart form; the screenshot is optional). Limited per owner and per network. */
export async function POST(request: Request) {
  if (!(await sameOrigin())) return json(403, { error: "failed" });
  const user = await currentUser();
  if (!user) return json(401, { error: "access" });
  // A length is required, so a chunked body can't be buffered before the size is known.
  const length = Number(request.headers.get("content-length") ?? NaN);
  if (!Number.isFinite(length)) return json(411, { error: "failed" });
  if (length > MAX_SCREENSHOT_BYTES + 100_000) return json(413, { error: "screenshot_size" });
  const form = await request.formData().catch(() => null);
  if (!form) return json(400, { error: "failed" });
  const file = form.get("screenshot");
  const fields = Object.fromEntries(["type", "message", "rating", "page", "locale", "device"].map((k) => [k, typeof form.get(k) === "string" ? form.get(k) : undefined]));
  const svc = services();
  try {
    const result = await submitFeedback(
      { store: svc.feedback, limiter: svc.rateLimiter },
      {
        ownerId: user.id,
        verified: user.verified,
        network: ipBucket(await clientIp()),
        fields,
        userAgent: (await headers()).get("user-agent"),
        hasScreenshot: file instanceof File && file.size > 0,
        screenshot: async () => {
          if (!(file instanceof File) || file.size > MAX_SCREENSHOT_BYTES) return "invalid";
          // One decode, pixel-limited; re-encoded to WebP with a thumbnail. Never stored as uploaded.
          const img = await processScreenshot(Buffer.from(await file.arrayBuffer()));
          return img.ok ? { full: img.full, thumb: img.thumb } : "invalid";
        },
      },
    );
    if (!result.ok) return json(result.error === "too_many" || result.error === "screenshot_quota" ? 429 : result.error === "screenshot_unverified" ? 403 : 400, { error: result.error });
    return json(201, { id: result.feedback.id });
  } catch (error) {
    reportError("feedback save failed", error);
    return json(500, { error: "failed" });
  }
}

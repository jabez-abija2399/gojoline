import { createHash } from "node:crypto";
import { ipAllowed } from "@/lib/cloud/ip-limit";
import { ipBucket } from "@/lib/cloud/submit";
import { addisDay } from "@/lib/dashboard/stats";
import { isShortCode, shortTarget } from "@/lib/growth/short-links";
import { reportError } from "@/lib/observability/report";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

/**
 * A short tracking link (lib/growth/short-links.ts): counts one visit per internet connection,
 * link and day (no address kept: a hashed bucket in Redis for a day), then sends the visitor to
 * the home page with the link's utm tags. An unknown code just goes home.
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  if (!isShortCode(code)) return redirect(`${base}/`);
  try {
    const svc = services();
    const ip = await clientIp();
    if (await ipAllowed(svc.rateLimiter, "short-link", ip, 60).catch(() => false)) {
      const day = addisDay(Date.now());
      const network = createHash("sha256").update(`gojo-track:${ipBucket(ip)}`).digest("hex").slice(0, 24);
      const first = await svc.rateLimiter.hit(`short-once:${network}:${day}:${code}`, 1, 86_400_000).catch(() => ({ allowed: false }));
      if (first.allowed) await svc.analyticsEvents.bump(day, "link_visit", code);
    }
  } catch (e) {
    // Counting never stops the visitor.
    reportError("short link count failed", e);
  }
  return redirect(`${base}${shortTarget(code)}`);
}

function redirect(to: string) {
  return new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

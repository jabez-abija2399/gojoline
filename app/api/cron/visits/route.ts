import { timingSafeEqual } from "node:crypto";
import { addisDay } from "@/lib/dashboard/stats";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";
import { rollupDay } from "@/lib/visits/stats";
import { RETENTION_DAYS } from "@/lib/feedback/types";

export const maxDuration = 60;

/**
 * Daily Vercel cron (vercel.json, 00:20 Addis Ababa time): copies yesterday's and the day
 * before's live visit counts into Postgres before Redis lets them expire (3 days). The
 * dashboard also tops up recent days when it reads them, so a missed run loses nothing.
 * A second, separate step clears feedback screenshots older than 90 days (the text stays).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || given.length !== want.length || !timingSafeEqual(given, want)) return new Response(null, { status: 401 });
  const svc = services();
  const now = Date.now();
  const out: { ok: boolean; sites?: number; screenshotsCleared?: number } = { ok: true };
  try {
    let sites = 0;
    for (const back of [1, 2]) sites += await rollupDay(svc.visits, addisDay(now - back * 86_400_000));
    out.sites = sites;
  } catch (e) {
    reportError("visits rollup failed", e);
    out.ok = false;
  }
  // Separate step: a failed rollup never keeps old screenshots, and the reverse.
  try {
    out.screenshotsCleared = await svc.feedback.purgeScreenshots(new Date(now - RETENTION_DAYS * 86_400_000));
  } catch (e) {
    reportError("feedback screenshot retention failed", e);
    out.ok = false;
  }
  return Response.json(out, { status: out.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}

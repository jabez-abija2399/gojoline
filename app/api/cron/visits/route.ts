import { timingSafeEqual } from "node:crypto";
import { addisDay } from "@/lib/dashboard/stats";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";
import { rollupDay } from "@/lib/visits/stats";

export const maxDuration = 60;

/**
 * Daily Vercel cron (vercel.json, 00:20 Addis Ababa time): copies yesterday's and the day
 * before's live visit counts into Postgres before Redis lets them expire (3 days). The
 * dashboard also tops up recent days when it reads them, so a missed run loses nothing.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || given.length !== want.length || !timingSafeEqual(given, want)) return new Response(null, { status: 401 });
  const deps = services().visits;
  const now = Date.now();
  try {
    let sites = 0;
    for (const back of [1, 2]) sites += await rollupDay(deps, addisDay(now - back * 86_400_000));
    return Response.json({ ok: true, sites }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    reportError("visits rollup failed", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

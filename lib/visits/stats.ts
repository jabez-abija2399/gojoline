import { addisDay } from "@/lib/dashboard/stats";
import { DEVICES, SOURCES, type Device, type Source } from "./classify";
import type { DayCounts, VisitCounter } from "./counter";
import type { VisitsDailyStore } from "./daily";

const DAY = 86_400_000;
/** Days still in the live counter (its keys last 3 days). */
const LIVE_DAYS = 3;

export interface VisitDeps {
  counter: VisitCounter;
  daily: VisitsDailyStore;
}

/**
 * Copies one day's live counts into Postgres for every site that had visits. Run daily for
 * yesterday (Vercel cron, see app/api/cron/visits); safe to run again.
 */
export async function rollupDay(deps: VisitDeps, day: string): Promise<number> {
  const sites = await deps.counter.sitesOn(day);
  let n = 0;
  for (const projectId of sites) {
    const counts = await deps.counter.day(projectId, day);
    if (!counts) continue;
    await deps.daily.upsert(projectId, day, counts);
    n++;
  }
  return n;
}

export interface VisitStats {
  /** Oldest first, ending today; visitors per day. */
  perDay: { day: string; value: number }[];
  thisWeek: number;
  lastWeek: number;
  /** The last 7 days, people per source and device. */
  sources: Partial<Record<Source, number>>;
  devices: Partial<Record<Device, number>>;
  /** Anything counted ever (so the page can tell "no visitors yet" from "none this fortnight"). */
  any: boolean;
}

/**
 * The dashboard's visitor numbers for the last 14 days. Older days come from Postgres; the
 * last 3 from the live counter, and finished days among them are written back (a top-up, so a
 * missed cron run loses nothing while the live counts still exist). Owner-scoped.
 */
export async function visitStats(deps: VisitDeps, ownerId: string, projectId: string, now = Date.now(), days = 14): Promise<VisitStats> {
  const dayAt = (i: number) => addisDay(now - i * DAY);
  const stored = await deps.daily.range(ownerId, projectId, dayAt(days - 1), dayAt(0));
  const byDay = new Map<string, DayCounts>(stored.map((r) => [r.day, r]));
  // The caller checked ownership for the live part: range() above is owner-scoped, and the
  // dashboard only asks for its own project.
  const live = await Promise.all(Array.from({ length: LIVE_DAYS }, (_, i) => deps.counter.day(projectId, dayAt(i)).catch(() => null)));
  await Promise.all(
    live.map(async (c, i) => {
      if (!c) return;
      const day = dayAt(i);
      const old = byDay.get(day);
      if (!old || c.views >= old.views) byDay.set(day, c);
      if (i > 0 && (!old || c.views > old.views)) await deps.daily.upsert(projectId, day, c).catch(() => undefined);
    }),
  );
  const perDay = Array.from({ length: days }, (_, k) => {
    const day = dayAt(days - 1 - k);
    return { day, value: byDay.get(day)?.visitors ?? 0 };
  });
  const sum = (from: number, to: number) => perDay.slice(from, to).reduce((n, d) => n + d.value, 0);
  const sources: Partial<Record<Source, number>> = {};
  const devices: Partial<Record<Device, number>> = {};
  for (let i = 0; i < 7; i++) {
    const c = byDay.get(dayAt(i));
    for (const s of SOURCES) if (c?.referrers[s]) sources[s] = (sources[s] ?? 0) + c.referrers[s]!;
    for (const d of DEVICES) if (c?.devices[d]) devices[d] = (devices[d] ?? 0) + c.devices[d]!;
  }
  return { perDay, thisWeek: sum(days - 7, days), lastWeek: sum(days - 14, days - 7), sources, devices, any: [...byDay.values()].some((c) => c.views > 0) };
}

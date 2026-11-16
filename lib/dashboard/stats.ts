import type { DayPoint } from "@/lib/admin/stats";

const DAY = 86_400_000;
/** Days are Addis Ababa days (UTC+3, no daylight saving): an answer at 1 am belongs to that day. */
const ADDIS = 3 * 3_600_000;
/** The Addis Ababa calendar day of a moment, as "YYYY-MM-DD". */
export const addisDay = (t: number) => new Date(t + ADDIS).toISOString().slice(0, 10);

export interface AnswerStats {
  total: number;
  /** Messages still New (waiting for an answer). */
  waiting: number;
  /** The last 7 days (today included), and the 7 before them (for the trend). */
  thisWeek: number;
  lastWeek: number;
  /** One point per day, oldest first, ending today (Addis Ababa days). */
  perDay: DayPoint[];
}

/**
 * Counts for the site dashboard: `perDay` from the database's count per day (at least the last
 * 14 days), `counts` the exact totals, so a busy site is never under-counted.
 */
export function answerStats(perDay: { day: string; count: number }[], counts: { total: number; waiting: number }, now = Date.now(), days = 14): AnswerStats {
  const byDay = new Map(perDay.map((d) => [d.day, d.count]));
  const series: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = addisDay(now - i * DAY);
    series.push({ day, value: byDay.get(day) ?? 0 });
  }
  const sum = (from: number, to: number) => series.slice(from, to).reduce((n, d) => n + d.value, 0);
  return { total: counts.total, waiting: counts.waiting, thisWeek: sum(days - 7, days), lastWeek: sum(days - 14, days - 7), perDay: series };
}

export type Trend = { kind: "up" | "down"; n: number } | { kind: "same" | "first" | "new" | "none" };

/** The last 7 days against the 7 before, in words the page can pick from (never a claim that isn't true). */
export function weekTrend(s: Pick<AnswerStats, "thisWeek" | "lastWeek" | "total">): Trend {
  if (s.lastWeek === 0 && s.thisWeek === 0) return { kind: s.total === 0 ? "none" : "same" };
  if (s.lastWeek === 0) return { kind: s.total === s.thisWeek ? "first" : "new" };
  const d = s.thisWeek - s.lastWeek;
  return d === 0 ? { kind: "same" } : { kind: d > 0 ? "up" : "down", n: Math.abs(d) };
}

export type SetupStep = "build" | "publish" | "info" | "photos" | "telegram" | "domain";

/** What makes a site complete, in the order an owner usually does it. */
export function setupSteps(s: { hasVersion: boolean; live: boolean; info: boolean; photos: number; telegram: boolean; ownDomain: boolean }): { id: SetupStep; done: boolean }[] {
  return [
    { id: "build", done: s.hasVersion },
    { id: "publish", done: s.live },
    { id: "info", done: s.info },
    { id: "photos", done: s.photos > 0 },
    { id: "telegram", done: s.telegram },
    { id: "domain", done: s.ownDomain },
  ];
}

/** The first few values of an answer, for a one-line preview ("Abebe · 0911… · 2 people"). */
export function answerPreview(data: Record<string, string>, max = 3): string {
  return Object.values(data)
    .map((v) => v.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, max)
    .map((v) => ([...v].length > 40 ? `${[...v].slice(0, 39).join("")}…` : v))
    .join(" · ");
}

/** The one step the Home page offers next: the first one not done (null when all are). */
export function nextStep<T extends { done: boolean }>(steps: T[]): T | null {
  return steps.find((s) => !s.done) ?? null;
}

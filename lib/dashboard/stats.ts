import type { DayPoint } from "@/lib/admin/stats";
import type { Submission } from "@/lib/cloud/types";

const DAY = 86_400_000;
/** Days are Addis Ababa days (UTC+3, no daylight saving): an answer at 1 am belongs to that day. */
const ADDIS = 3 * 3_600_000;
const dayKey = (t: number) => new Date(t + ADDIS).toISOString().slice(0, 10);

export interface AnswerStats {
  total: number;
  unread: number;
  /** The last 7 days, and the 7 before them (for the trend). */
  thisWeek: number;
  lastWeek: number;
  /** One point per day, oldest first, ending today (UTC). */
  perDay: DayPoint[];
  lastAt: Date | null;
}

/**
 * Counts for the site dashboard. `answers` are the recent ones (at least the last 14 days);
 * `counts` are exact totals from the database, so a busy site is never under-counted.
 */
export function answerStats(answers: Pick<Submission, "createdAt" | "readAt">[], counts: { total: number; unread: number }, now = Date.now(), days = 14): AnswerStats {
  const today = Date.parse(dayKey(now)) - ADDIS;
  const perDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) perDay.set(dayKey(today - i * DAY), 0);
  let thisWeek = 0;
  let lastWeek = 0;
  let lastAt: Date | null = null;
  for (const a of answers) {
    const t = a.createdAt.getTime();
    const age = now - t;
    if (age < 7 * DAY) thisWeek++;
    else if (age < 14 * DAY) lastWeek++;
    const key = dayKey(t);
    if (perDay.has(key)) perDay.set(key, perDay.get(key)! + 1);
    if (!lastAt || t > lastAt.getTime()) lastAt = a.createdAt;
  }
  return { total: counts.total, unread: counts.unread, thisWeek, lastWeek, perDay: [...perDay].map(([day, value]) => ({ day, value })), lastAt };
}

export type Trend = { kind: "up" | "down"; n: number } | { kind: "same" | "first" | "new" | "none" };

/** The last 7 days against the 7 before, in words the page can pick from (never a claim that isn't true). */
export function weekTrend(s: Pick<AnswerStats, "thisWeek" | "lastWeek" | "total">): Trend {
  if (s.lastWeek === 0 && s.thisWeek === 0) return { kind: s.total === 0 ? "none" : "same" };
  if (s.lastWeek === 0) return { kind: s.total === s.thisWeek ? "first" : "new" };
  const d = s.thisWeek - s.lastWeek;
  return d === 0 ? { kind: "same" } : { kind: d > 0 ? "up" : "down", n: Math.abs(d) };
}

export type SetupStep = "build" | "publish" | "photos" | "telegram" | "domain";

/** What makes a site complete, in the order an owner usually does it. */
export function setupSteps(s: { hasVersion: boolean; live: boolean; photos: number; telegram: boolean; ownDomain: boolean }): { id: SetupStep; done: boolean }[] {
  return [
    { id: "build", done: s.hasVersion },
    { id: "publish", done: s.live },
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

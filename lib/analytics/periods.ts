/**
 * Day, week and month buckets for admin analytics, in Addis Ababa time (UTC+3, no daylight
 * saving), the same days the owner dashboard uses. A bucket is named by its first day
 * (YYYY-MM-DD); weeks start on Monday (Postgres `date_trunc('week')` does the same).
 */
export const PERIODS = ["day", "week", "month"] as const;
export type Period = (typeof PERIODS)[number];

/** How many buckets each chart shows. */
export const BUCKETS: Record<Period, number> = { day: 14, week: 12, month: 12 };

const ADDIS_MS = 3 * 3_600_000;
const DAY_MS = 86_400_000;

const iso = (d: Date) => d.toISOString().slice(0, 10);
/** Today in Addis Ababa as a UTC-midnight date (so date maths stays in whole days). */
const addisToday = (now: Date) => new Date(iso(new Date(now.getTime() + ADDIS_MS)) + "T00:00:00Z");

/** The first day of the bucket that holds `day` (YYYY-MM-DD). */
export function bucketOf(day: string, period: Period): string {
  const d = new Date(day + "T00:00:00Z");
  if (period === "day") return day;
  if (period === "month") return day.slice(0, 8) + "01";
  const back = (d.getUTCDay() + 6) % 7; // Monday = 0
  return iso(new Date(d.getTime() - back * DAY_MS));
}

/** The last `BUCKETS[period]` buckets, oldest first; the last one is the current (unfinished) one. */
export function buckets(period: Period, now: Date): string[] {
  const today = addisToday(now);
  const out: string[] = [];
  let cur = bucketOf(iso(today), period);
  for (let i = 0; i < BUCKETS[period]; i++) {
    out.unshift(cur);
    const d = new Date(cur + "T00:00:00Z");
    if (period === "day") cur = iso(new Date(d.getTime() - DAY_MS));
    else if (period === "week") cur = iso(new Date(d.getTime() - 7 * DAY_MS));
    else cur = iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)));
  }
  return out;
}

/** The instant an Addis Ababa day starts (for timestamp filters). */
export const addisStart = (day: string) => new Date(new Date(day + "T00:00:00Z").getTime() - ADDIS_MS);

/** The day after the current bucket ends (exclusive), Addis Ababa. */
export function bucketEnd(start: string, period: Period): string {
  const d = new Date(start + "T00:00:00Z");
  if (period === "day") return iso(new Date(d.getTime() + DAY_MS));
  if (period === "week") return iso(new Date(d.getTime() + 7 * DAY_MS));
  return iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)));
}

/** Change from the previous bucket in whole percent; null when there was nothing before. */
export function change(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Sums rows by bucket, with every bucket present (0 when empty). */
export function fill(rows: { bucket: string; value: number | string | null }[], all: string[]): { day: string; value: number }[] {
  const by = new Map<string, number>();
  for (const r of rows) by.set(r.bucket, (by.get(r.bucket) ?? 0) + Number(r.value ?? 0));
  return all.map((b) => ({ day: b, value: by.get(b) ?? 0 }));
}

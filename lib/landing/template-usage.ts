import "server-only";
import { and, countDistinct, eq, isNotNull, or, sql } from "drizzle-orm";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Database } from "@/lib/db/client";
import { getDb } from "@/lib/db/client";
import { projects, sites, user } from "@/lib/db/schema";
import { isPresetId, type PresetId } from "@/lib/template/presets";

/** "Used by N businesses" shows only from this many; a smaller number says little and reads as empty. */
export const USAGE_MIN_TO_SHOW = 10;
/** The counts are refreshed at most once an hour, so the public page never waits on a count. */
export const USAGE_REVALIDATE_SECONDS = 3600;

export type TemplateUsage = Partial<Record<PresetId, number>>;

/** How long the page waits for the count before showing the page without it. */
export const USAGE_TIMEOUT_MS = 300;
/** After a failed or slow count, don't try again on every request for this long. */
const FAILURE_BACKOFF_MS = 60_000;

/**
 * How many real businesses use each template: distinct owners (one person trying a template five
 * times counts once) who are verified (a real verified email or a verified phone, the same rule as
 * lib/auth/verified.ts) and whose site from that template is live. Throwaway accounts and sites
 * never published don't count.
 */
export async function countTemplateUsage(db: Database): Promise<TemplateUsage> {
  const verified = or(and(eq(user.emailVerified, true), sql`${user.email} not like '%@phone.gojoline.invalid'`), eq(user.phoneNumberVerified, true));
  const rows = await db
    .select({ templateId: projects.templateId, n: countDistinct(projects.ownerId) })
    .from(projects)
    .innerJoin(sites, and(eq(sites.projectId, projects.id), eq(sites.status, "published")))
    .innerJoin(user, eq(user.id, projects.ownerId))
    .where(and(isNotNull(projects.templateId), verified))
    .groupBy(projects.templateId);
  const out: TemplateUsage = {};
  for (const r of rows) if (isPresetId(r.templateId)) out[r.templateId] = Number(r.n);
  return out;
}

/** The number to show for a template, or null when it is too small to show (or unknown). */
export function usageToShow(usage: TemplateUsage, id: PresetId, min: number = USAGE_MIN_TO_SHOW): number | null {
  const n = usage[id] ?? 0;
  return n >= min ? n : null;
}

const cachedCount = unstable_cache(
  async () => {
    const db = getDb();
    return db ? countTemplateUsage(db) : {};
  },
  ["template-usage-v1"],
  { revalidate: USAGE_REVALIDATE_SECONDS, tags: ["template-usage"] },
);

let failedAt = 0;

/** Resolves to `fallback` if `work` takes longer than `ms` (the work itself is left to finish). */
export async function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<{ value: T; timedOut: boolean }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<{ value: T; timedOut: boolean }>((resolve) => {
    timer = setTimeout(() => resolve({ value: fallback, timedOut: true }), ms);
  });
  const done = work.then((value) => ({ value, timedOut: false }));
  // A failure after the timeout has nobody waiting for it: don't let it go unhandled.
  done.catch(() => undefined);
  try {
    return await Promise.race([done, late]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cached counts for the public pages. Empty without a database (dev, e2e), when the count fails,
 * or when it takes longer than USAGE_TIMEOUT_MS (a cold database never holds the page up); after
 * a failure or timeout this instance skips the count for a minute.
 */
export async function templateUsage(now: number = Date.now()): Promise<TemplateUsage> {
  if (!getDb() || now - failedAt < FAILURE_BACKOFF_MS) return {};
  try {
    const { value, timedOut } = await withTimeout(cachedCount(), USAGE_TIMEOUT_MS, {} as TemplateUsage);
    if (timedOut) failedAt = now;
    return value;
  } catch (e) {
    failedAt = now;
    console.error("template usage count failed", e instanceof Error ? e.message : "unknown");
    return {};
  }
}

/** A site went live or was taken down: the counts may have changed (served fresh on the next count). */
export function refreshTemplateUsage(): void {
  try {
    revalidateTag("template-usage", "max");
  } catch {
    // Outside a request (tests, scripts) there is no cache to refresh.
  }
}

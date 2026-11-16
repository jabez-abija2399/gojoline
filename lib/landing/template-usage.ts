import "server-only";
import { countDistinct, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import type { Database } from "@/lib/db/client";
import { getDb } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { isPresetId, type PresetId } from "@/lib/template/presets";

/** "Used by N businesses" shows only from this many; a smaller number says little and reads as empty. */
export const USAGE_MIN_TO_SHOW = 10;
/** The counts are refreshed at most once an hour, so the public page never waits on a count. */
export const USAGE_REVALIDATE_SECONDS = 3600;

export type TemplateUsage = Partial<Record<PresetId, number>>;

/**
 * How many owners started a site from each template (distinct owners, so one person trying a
 * template five times counts once). Projects without a template are left out.
 */
export async function countTemplateUsage(db: Database): Promise<TemplateUsage> {
  const rows = await db
    .select({ templateId: projects.templateId, n: countDistinct(projects.ownerId) })
    .from(projects)
    .where(isNotNull(projects.templateId))
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

/** Cached counts for the public pages; empty without a database (dev, e2e) or when the count fails. */
export async function templateUsage(): Promise<TemplateUsage> {
  if (!getDb()) return {};
  try {
    return await cachedCount();
  } catch (e) {
    console.error("template usage count failed", e instanceof Error ? e.message : "unknown");
    return {};
  }
}

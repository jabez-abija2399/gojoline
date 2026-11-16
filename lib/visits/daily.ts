import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { projects, siteVisitsDaily } from "@/lib/db/schema";
import { DEVICES, SOURCES } from "./classify";
import type { DayCounts } from "./counter";

/** Visits per site per day, kept in Postgres (rolled up from the live counter). */
export interface VisitsDailyStore {
  /** Keeps the larger counts when a day is written twice (the live counter only grows). */
  upsert(projectId: string, day: string, counts: DayCounts): Promise<void>;
  /** Owner-scoped: days from..to (YYYY-MM-DD, inclusive). */
  range(ownerId: string, projectId: string, from: string, to: string): Promise<({ day: string } & DayCounts)[]>;
}

const clean = (c: { referrers: unknown; devices: unknown }) => {
  const pick = (keys: readonly string[], v: unknown) => Object.fromEntries(keys.flatMap((k) => { const n = Number((v as Record<string, unknown> | null)?.[k] ?? 0); return n > 0 ? [[k, n]] : []; }));
  return { referrers: pick(SOURCES, c.referrers), devices: pick(DEVICES, c.devices) };
};

export class MemoryVisitsDailyStore implements VisitsDailyStore {
  private rows = new Map<string, DayCounts>();
  /** e2e/dev: which owner each project belongs to (the database joins projects instead). */
  constructor(private ownerOf: (projectId: string) => Promise<string | null>) {}
  async upsert(projectId: string, day: string, counts: DayCounts) {
    const key = `${projectId}:${day}`;
    const cur = this.rows.get(key);
    if (cur && cur.views > counts.views) return;
    this.rows.set(key, { views: counts.views, visitors: Math.max(cur?.visitors ?? 0, counts.visitors), ...clean(counts) });
  }
  async range(ownerId: string, projectId: string, from: string, to: string) {
    if ((await this.ownerOf(projectId)) !== ownerId) return [];
    return [...this.rows].flatMap(([k, v]) => {
      const day = k.slice(projectId.length + 1);
      return k.startsWith(`${projectId}:`) && day >= from && day <= to ? [{ day, ...v }] : [];
    });
  }
}

export class DbVisitsDailyStore implements VisitsDailyStore {
  constructor(private db: Database) {}
  async upsert(projectId: string, day: string, counts: DayCounts) {
    const t = siteVisitsDaily;
    await this.db
      .insert(t)
      .values({ projectId, day, views: counts.views, visitors: counts.visitors, referrers: counts.referrers, devices: counts.devices })
      .onConflictDoUpdate({
        target: [t.projectId, t.day],
        set: {
          views: sql`greatest(${t.views}, excluded.views)`,
          visitors: sql`greatest(${t.visitors}, excluded.visitors)`,
          referrers: sql`case when excluded.views >= ${t.views} then excluded.referrers else ${t.referrers} end`,
          devices: sql`case when excluded.views >= ${t.views} then excluded.devices else ${t.devices} end`,
          updatedAt: new Date(),
        },
      });
  }
  async range(ownerId: string, projectId: string, from: string, to: string) {
    const t = siteVisitsDaily;
    const rows = await this.db
      .select({ day: t.day, views: t.views, visitors: t.visitors, referrers: t.referrers, devices: t.devices })
      .from(t)
      .innerJoin(projects, eq(projects.id, t.projectId))
      .where(and(eq(t.projectId, projectId), eq(projects.ownerId, ownerId), gte(t.day, from), lte(t.day, to)));
    return rows.map((r) => ({ day: String(r.day), views: r.views, visitors: r.visitors, ...clean(r) }));
  }
}

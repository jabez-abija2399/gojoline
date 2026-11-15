import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { abuseReports, sites } from "@/lib/db/schema";

export const REPORT_REASONS = ["phishing", "scam", "adult", "illegal_goods", "violence_hate", "impersonation", "copyright", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface AbuseReport {
  id: string;
  siteId: string;
  reason: ReportReason;
  details: string | null;
  contact: string | null;
  status: "open" | "dismissed" | "actioned";
  createdAt: Date;
}

/** Open reports grouped by site, for the admin queue. */
export interface ReportedSite {
  siteId: string;
  slug: string;
  url: string | null;
  siteStatus: string;
  /** Different networks that reported the site (one network filing many reports counts once). */
  reporters: number;
  reports: AbuseReport[];
}

export interface ReportStore {
  /** One open report per site and reporter: a repeat returns null. */
  add(r: { siteId: string; reason: ReportReason; details: string | null; contact: string | null; reporterKey: string }): Promise<AbuseReport | null>;
  /** Sites with open reports, most reported first. */
  openBySite(limit: number): Promise<ReportedSite[]>;
  /** Closes every open report for a site. */
  closeForSite(siteId: string, status: "dismissed" | "actioned", adminId: string): Promise<number>;
}

const group = (rows: (AbuseReport & { slug: string; url: string | null; siteStatus: string; reporterKey: string })[], limit: number): ReportedSite[] => {
  const by = new Map<string, ReportedSite & { keys: Set<string> }>();
  for (const { slug, url, siteStatus, reporterKey, ...r } of rows) {
    const g = by.get(r.siteId) ?? { siteId: r.siteId, slug, url, siteStatus, reporters: 0, reports: [], keys: new Set<string>() };
    g.reports.push(r);
    g.keys.add(reporterKey);
    g.reporters = g.keys.size;
    by.set(r.siteId, g);
  }
  return [...by.values()].map(({ keys: _k, ...g }) => (void _k, g)).sort((a, b) => b.reporters - a.reporters).slice(0, limit);
};

export class MemoryReportStore implements ReportStore {
  readonly reports: (AbuseReport & { reporterKey: string })[] = [];
  constructor(private siteInfo: (siteId: string) => Promise<{ slug: string; url: string | null; status: string } | null>) {}

  async add(r: { siteId: string; reason: ReportReason; details: string | null; contact: string | null; reporterKey: string }) {
    if (this.reports.some((x) => x.siteId === r.siteId && x.reporterKey === r.reporterKey && x.status === "open")) return null;
    const report = { ...r, id: randomUUID(), status: "open" as const, createdAt: new Date() };
    this.reports.push(report);
    const { reporterKey: _k, ...pub } = report;
    void _k;
    return pub;
  }
  async openBySite(limit: number) {
    const rows = [];
    for (const r of this.reports.filter((x) => x.status === "open")) {
      const s = await this.siteInfo(r.siteId);
      if (s) rows.push({ ...r, slug: s.slug, url: s.url, siteStatus: s.status });
    }
    return group(rows, limit);
  }
  async closeForSite(siteId: string, status: "dismissed" | "actioned") {
    let n = 0;
    for (const r of this.reports) {
      if (r.siteId !== siteId || r.status !== "open") continue;
      r.status = status;
      n++;
    }
    return n;
  }
}

export class DbReportStore implements ReportStore {
  constructor(private db: Database) {}
  private cols = {
    id: abuseReports.id,
    siteId: abuseReports.siteId,
    reason: abuseReports.reason,
    details: abuseReports.details,
    contact: abuseReports.contact,
    status: abuseReports.status,
    createdAt: abuseReports.createdAt,
  };
  async add(r: { siteId: string; reason: ReportReason; details: string | null; contact: string | null; reporterKey: string }) {
    const [row] = await this.db.insert(abuseReports).values({ ...r, status: "open" }).onConflictDoNothing().returning(this.cols);
    return row ?? null;
  }
  async openBySite(limit: number) {
    const rows = await this.db
      .select({ ...this.cols, reporterKey: abuseReports.reporterKey, slug: sites.slug, url: sites.url, siteStatus: sites.status })
      .from(abuseReports)
      .innerJoin(sites, eq(sites.id, abuseReports.siteId))
      .where(eq(abuseReports.status, "open"))
      .orderBy(desc(abuseReports.createdAt))
      .limit(2000);
    return group(rows, limit);
  }
  async closeForSite(siteId: string, status: "dismissed" | "actioned", adminId: string) {
    const rows = await this.db
      .update(abuseReports)
      .set({ status, reviewedBy: adminId, reviewedAt: sql`now()` })
      .where(and(eq(abuseReports.siteId, siteId), eq(abuseReports.status, "open")))
      .returning({ id: abuseReports.id });
    return rows.length;
  }
}

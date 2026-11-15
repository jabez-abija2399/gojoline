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
  reports: AbuseReport[];
}

export interface ReportStore {
  add(r: { siteId: string; reason: ReportReason; details: string | null; contact: string | null; reporterKey: string }): Promise<AbuseReport>;
  /** Sites with open reports, most reported first. */
  openBySite(limit: number): Promise<ReportedSite[]>;
  /** Closes every open report for a site. */
  closeForSite(siteId: string, status: "dismissed" | "actioned", adminId: string): Promise<number>;
}

const group = (rows: (AbuseReport & { slug: string; url: string | null; siteStatus: string })[], limit: number): ReportedSite[] => {
  const by = new Map<string, ReportedSite>();
  for (const { slug, url, siteStatus, ...r } of rows) {
    const g = by.get(r.siteId) ?? { siteId: r.siteId, slug, url, siteStatus, reports: [] };
    g.reports.push(r);
    by.set(r.siteId, g);
  }
  return [...by.values()].sort((a, b) => b.reports.length - a.reports.length).slice(0, limit);
};

export class MemoryReportStore implements ReportStore {
  readonly reports: (AbuseReport & { reporterKey: string })[] = [];
  constructor(private siteInfo: (siteId: string) => Promise<{ slug: string; url: string | null; status: string } | null>) {}

  async add(r: { siteId: string; reason: ReportReason; details: string | null; contact: string | null; reporterKey: string }) {
    const report = { ...r, id: randomUUID(), status: "open" as const, createdAt: new Date() };
    this.reports.push(report);
    const { reporterKey: _k, ...pub } = report;
    void _k;
    return pub;
  }
  async openBySite(limit: number) {
    const rows = [];
    for (const { reporterKey: _k, ...r } of this.reports.filter((x) => x.status === "open")) {
      void _k;
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
    const [row] = await this.db.insert(abuseReports).values({ ...r, status: "open" }).returning(this.cols);
    return row!;
  }
  async openBySite(limit: number) {
    const rows = await this.db
      .select({ ...this.cols, slug: sites.slug, url: sites.url, siteStatus: sites.status })
      .from(abuseReports)
      .innerJoin(sites, eq(sites.id, abuseReports.siteId))
      .where(eq(abuseReports.status, "open"))
      .orderBy(desc(abuseReports.createdAt))
      .limit(500);
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

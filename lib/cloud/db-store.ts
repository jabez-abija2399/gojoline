import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import type { MessageStatus } from "@/lib/dashboard/message-status";
import { MESSAGE_STATUSES, canMove } from "@/lib/dashboard/message-status";
import type { Database } from "@/lib/db/client";
import { formSubmissions, siteForms, sites } from "@/lib/db/schema";
import { formDef, type FormDef } from "./forms";
import type { CloudStore, Submission } from "./types";

export class DbCloudStore implements CloudStore {
  constructor(private db: Database) {}

  async publicSite(projectId: string) {
    const [row] = await this.db
      .select({ siteId: sites.id, projectId: sites.projectId, ownerId: sites.ownerId, siteKey: sites.siteKey, status: sites.status, url: sites.url, customDomain: sites.customDomain, offlineAt: sites.offlineAt })
      .from(sites)
      .where(eq(sites.projectId, projectId))
      .limit(1);
    if (!row) return null;
    const { offlineAt, ...rest } = row;
    return { ...rest, offline: offlineAt !== null };
  }

  async saveForms(siteId: string, forms: FormDef[]) {
    // Replace the set: forms removed from the site stop accepting answers.
    await this.db.delete(siteForms).where(eq(siteForms.siteId, siteId));
    if (forms.length) {
      await this.db.insert(siteForms).values(forms.map((f) => ({ siteId, formKey: f.id, kind: f.kind, definition: f as unknown as Record<string, unknown> })));
    }
  }

  async getForm(siteId: string, formKey: string) {
    const [row] = await this.db.select().from(siteForms).where(and(eq(siteForms.siteId, siteId), eq(siteForms.formKey, formKey))).limit(1);
    const parsed = row ? formDef.safeParse(row.definition) : null;
    return parsed?.success ? parsed.data : null;
  }

  async getForms(siteId: string, formKeys: string[]) {
    if (!formKeys.length) return [];
    const rows = await this.db.select().from(siteForms).where(and(eq(siteForms.siteId, siteId), inArray(siteForms.formKey, formKeys)));
    return rows.flatMap((r) => {
      const parsed = formDef.safeParse(r.definition);
      return parsed.success ? [parsed.data] : [];
    });
  }

  async addSubmission(input: Omit<Submission, "id" | "readAt" | "status" | "createdAt">) {
    const [row] = await this.db.insert(formSubmissions).values(input).returning();
    return row as Submission;
  }

  async listSubmissions(ownerId: string, projectId: string, limit = 200) {
    const rows = await this.db
      .select()
      .from(formSubmissions)
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId)))
      .orderBy(desc(formSubmissions.createdAt))
      .limit(limit);
    return rows as Submission[];
  }

  async countSubmissions(ownerId: string, projectId: string) {
    const [row] = await this.db
      .select({ total: sql<number>`count(*)::int`, waiting: sql<number>`count(*) filter (where ${formSubmissions.status} = 'new')::int` })
      .from(formSubmissions)
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId)));
    return { total: Number(row?.total ?? 0), waiting: Number(row?.waiting ?? 0) };
  }

  async answersPerDay(ownerId: string, projectId: string, since: Date) {
    const day = sql<string>`to_char((${formSubmissions.createdAt} at time zone 'Africa/Addis_Ababa')::date, 'YYYY-MM-DD')`;
    const rows = await this.db
      .select({ day, count: sql<number>`count(*)::int` })
      .from(formSubmissions)
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId), gte(formSubmissions.createdAt, since)))
      .groupBy(day);
    return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  }

  async setStatus(ownerId: string, projectId: string, ids: string[], status: MessageStatus) {
    if (!ids.length) return 0;
    // Only rows whose current status may move to the new one (see canMove).
    const from = MESSAGE_STATUSES.filter((s) => canMove(s, status));
    if (!from.length) return 0;
    const rows = await this.db
      .update(formSubmissions)
      .set({ status, readAt: sql`coalesce(${formSubmissions.readAt}, now())` })
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId), inArray(formSubmissions.id, ids), inArray(formSubmissions.status, from)))
      .returning({ id: formSubmissions.id });
    return rows.length;
  }

  async deleteSubmission(ownerId: string, projectId: string, id: string) {
    const rows = await this.db
      .delete(formSubmissions)
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId), eq(formSubmissions.id, id)))
      .returning({ id: formSubmissions.id });
    return rows.length > 0;
  }
}

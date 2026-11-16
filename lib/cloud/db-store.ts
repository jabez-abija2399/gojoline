import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { formSubmissions, siteForms, sites } from "@/lib/db/schema";
import { formDef, type FormDef } from "./forms";
import type { CloudStore, Submission } from "./types";

export class DbCloudStore implements CloudStore {
  constructor(private db: Database) {}

  async publicSite(projectId: string) {
    const [row] = await this.db
      .select({ siteId: sites.id, projectId: sites.projectId, ownerId: sites.ownerId, siteKey: sites.siteKey, status: sites.status, url: sites.url, customDomain: sites.customDomain })
      .from(sites)
      .where(eq(sites.projectId, projectId))
      .limit(1);
    return row ?? null;
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

  async addSubmission(input: Omit<Submission, "id" | "readAt" | "createdAt">) {
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
      .select({ total: sql<number>`count(*)::int`, unread: sql<number>`count(*) filter (where ${formSubmissions.readAt} is null)::int` })
      .from(formSubmissions)
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId)));
    return { total: Number(row?.total ?? 0), unread: Number(row?.unread ?? 0) };
  }

  async submissionsSince(ownerId: string, projectId: string, since: Date, limit = 2000) {
    const rows = await this.db
      .select()
      .from(formSubmissions)
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId), gte(formSubmissions.createdAt, since)))
      .orderBy(desc(formSubmissions.createdAt))
      .limit(limit);
    return rows as Submission[];
  }

  async markRead(ownerId: string, projectId: string, ids: string[]) {
    if (!ids.length) return;
    await this.db
      .update(formSubmissions)
      .set({ readAt: new Date() })
      .where(and(eq(formSubmissions.ownerId, ownerId), eq(formSubmissions.projectId, projectId), inArray(formSubmissions.id, ids), isNull(formSubmissions.readAt)));
  }
}

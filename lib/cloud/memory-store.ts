import { randomUUID } from "node:crypto";
import type { SiteStore } from "@/lib/sites/types";
import type { FormDef } from "./forms";
import type { CloudStore, Submission } from "./types";

export class MemoryCloudStore implements CloudStore {
  private forms = new Map<string, FormDef[]>();
  private submissions: Submission[] = [];
  constructor(private sites: SiteStore & { all(): Iterable<import("@/lib/sites/types").Site> }) {}

  async publicSite(projectId: string) {
    for (const s of this.sites.all()) {
      if (s.projectId === projectId) {
        return { siteId: s.id, projectId: s.projectId, ownerId: s.ownerId, siteKey: s.siteKey, status: s.status, url: s.url, customDomain: s.customDomain };
      }
    }
    return null;
  }
  async saveForms(siteId: string, forms: FormDef[]) {
    this.forms.set(siteId, forms);
  }
  async getForm(siteId: string, formKey: string) {
    return this.forms.get(siteId)?.find((f) => f.id === formKey) ?? null;
  }
  async addSubmission(input: Omit<Submission, "id" | "readAt" | "createdAt">) {
    const s: Submission = { ...input, id: randomUUID(), readAt: null, createdAt: new Date() };
    this.submissions.push(s);
    return s;
  }
  async listSubmissions(ownerId: string, projectId: string, limit = 200) {
    return this.submissions.filter((s) => s.ownerId === ownerId && s.projectId === projectId).reverse().slice(0, limit);
  }
  async countSubmissions(ownerId: string, projectId: string) {
    const mine = this.submissions.filter((s) => s.ownerId === ownerId && s.projectId === projectId);
    return { total: mine.length, unread: mine.filter((s) => !s.readAt).length };
  }
  async submissionsSince(ownerId: string, projectId: string, since: Date, limit = 2000) {
    return this.submissions.filter((s) => s.ownerId === ownerId && s.projectId === projectId && s.createdAt >= since).reverse().slice(0, limit);
  }
  async markRead(ownerId: string, projectId: string, ids: string[]) {
    for (const s of this.submissions) if (s.ownerId === ownerId && s.projectId === projectId && ids.includes(s.id)) s.readAt ??= new Date();
  }
}

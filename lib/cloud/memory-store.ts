import { addisDay } from "@/lib/dashboard/stats";
import { canMove, type MessageStatus } from "@/lib/dashboard/message-status";
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
        return { siteId: s.id, projectId: s.projectId, ownerId: s.ownerId, siteKey: s.siteKey, status: s.status, url: s.url, customDomain: s.customDomain, offline: Boolean(s.offlineAt) };
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
  async addSubmission(input: Omit<Submission, "id" | "readAt" | "status" | "createdAt">) {
    const s: Submission = { ...input, id: randomUUID(), readAt: null, status: "new", createdAt: new Date() };
    this.submissions.push(s);
    return s;
  }
  private mine(ownerId: string, projectId: string) {
    return this.submissions.filter((s) => s.ownerId === ownerId && s.projectId === projectId);
  }
  async listSubmissions(ownerId: string, projectId: string, limit = 200) {
    return this.mine(ownerId, projectId).reverse().slice(0, limit);
  }
  async countSubmissions(ownerId: string, projectId: string) {
    const mine = this.mine(ownerId, projectId);
    return { total: mine.length, waiting: mine.filter((s) => s.status === "new").length };
  }
  async answersPerDay(ownerId: string, projectId: string, since: Date) {
    const days = new Map<string, number>();
    for (const s of this.mine(ownerId, projectId)) {
      if (s.createdAt < since) continue;
      const day = addisDay(s.createdAt.getTime());
      days.set(day, (days.get(day) ?? 0) + 1);
    }
    return [...days].map(([day, count]) => ({ day, count }));
  }
  async setStatus(ownerId: string, projectId: string, ids: string[], status: MessageStatus) {
    let n = 0;
    for (const s of this.mine(ownerId, projectId)) {
      if (!ids.includes(s.id) || !canMove(s.status, status)) continue;
      s.status = status;
      s.readAt ??= new Date();
      n++;
    }
    return n;
  }
  async deleteSubmission(ownerId: string, projectId: string, id: string) {
    const i = this.submissions.findIndex((s) => s.id === id && s.ownerId === ownerId && s.projectId === projectId);
    if (i === -1) return false;
    this.submissions.splice(i, 1);
    return true;
  }
}

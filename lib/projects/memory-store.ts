import { randomUUID } from "node:crypto";
import type { ChatMessage, Project, ProjectStore, Version } from "./types";

/** Development/test store. Data is lost on restart. */
export class MemoryProjectStore implements ProjectStore {
  private projects = new Map<string, Project>();
  private messages: ChatMessage[] = [];
  private versions: Version[] = [];

  private owned(ownerId: string, projectId: string): Project | null {
    const p = this.projects.get(projectId);
    return p && p.ownerId === ownerId ? p : null;
  }

  async createProject(ownerId: string, input: { name: string; locale: "en" | "am"; templateId?: string | null }) {
    const now = new Date();
    const project: Project = { id: randomUUID(), ownerId, name: input.name, locale: input.locale, templateId: input.templateId ?? null, createdAt: now, updatedAt: now };
    this.projects.set(project.id, project);
    return project;
  }

  async getProject(ownerId: string, projectId: string) {
    return this.owned(ownerId, projectId);
  }

  async listProjects(ownerId: string) {
    return [...this.projects.values()].filter((p) => p.ownerId === ownerId).sort((a, b) => +b.updatedAt - +a.updatedAt);
  }

  async renameProject(ownerId: string, projectId: string, name: string) {
    const p = this.owned(ownerId, projectId);
    if (p) p.name = name;
  }

  async addMessage(ownerId: string, message: Omit<ChatMessage, "id" | "createdAt">) {
    const p = this.owned(ownerId, message.projectId);
    if (!p) throw new Error("Project not found");
    const saved: ChatMessage = { ...message, id: randomUUID(), createdAt: new Date() };
    this.messages.push(saved);
    p.updatedAt = saved.createdAt;
    return saved;
  }

  async listMessages(ownerId: string, projectId: string, limit = 200) {
    if (!this.owned(ownerId, projectId)) return [];
    return this.messages.filter((m) => m.projectId === projectId).slice(-limit);
  }

  async addVersion(ownerId: string, version: Omit<Version, "id" | "number" | "createdAt">) {
    if (!this.owned(ownerId, version.projectId)) throw new Error("Project not found");
    const number = this.versions.filter((v) => v.projectId === version.projectId).length + 1;
    const saved: Version = { ...version, files: { ...version.files }, id: randomUUID(), number, createdAt: new Date() };
    this.versions.push(saved);
    return saved;
  }

  async versionStats(ownerId: string, projectId: string) {
    const mine = this.owned(ownerId, projectId) ? this.versions.filter((v) => v.projectId === projectId) : [];
    return { count: mine.length, lastAt: mine.reduce<Date | null>((d, v) => (!d || v.createdAt > d ? v.createdAt : d), null) };
  }
  async listVersions(ownerId: string, projectId: string) {
    if (!this.owned(ownerId, projectId)) return [];
    return this.versions
      .filter((v) => v.projectId === projectId)
      .map((v) => ({ id: v.id, projectId: v.projectId, number: v.number, summary: v.summary, createdAt: v.createdAt }))
      .sort((a, b) => b.number - a.number);
  }

  async getVersion(ownerId: string, projectId: string, number: number) {
    if (!this.owned(ownerId, projectId)) return null;
    return this.versions.find((v) => v.projectId === projectId && v.number === number) ?? null;
  }

  async latestVersion(ownerId: string, projectId: string) {
    if (!this.owned(ownerId, projectId)) return null;
    const list = this.versions.filter((v) => v.projectId === projectId);
    return list.at(-1) ?? null;
  }
}

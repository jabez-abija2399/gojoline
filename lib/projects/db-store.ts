import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { messages, projects, projectVersions } from "@/lib/db/schema";
import type { ChatMessage, Project, ProjectStore, Version, VersionSummary } from "./types";

/** Postgres store. Every query is scoped by owner_id (tenant isolation). */
export class DbProjectStore implements ProjectStore {
  constructor(private db: Database) {}

  private async owns(ownerId: string, projectId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
      .limit(1);
    return rows.length === 1;
  }

  async createProject(ownerId: string, input: { name: string; locale: "en" | "am"; templateId?: string | null }): Promise<Project> {
    const [row] = await this.db.insert(projects).values({ ownerId, name: input.name, locale: input.locale, templateId: input.templateId ?? null }).returning();
    return row!;
  }

  async getProject(ownerId: string, projectId: string): Promise<Project | null> {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
      .limit(1);
    return row ?? null;
  }

  async listProjects(ownerId: string): Promise<Project[]> {
    return this.db.select().from(projects).where(eq(projects.ownerId, ownerId)).orderBy(desc(projects.updatedAt)).limit(100);
  }

  async renameProject(ownerId: string, projectId: string, name: string): Promise<void> {
    await this.db
      .update(projects)
      .set({ name: name.slice(0, 80), updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  }

  async addMessage(ownerId: string, message: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage> {
    if (!(await this.owns(ownerId, message.projectId))) throw new Error("Project not found");
    const [row] = await this.db
      .insert(messages)
      .values({ ...message, ownerId, status: message.status ?? null, versionNumber: message.versionNumber ?? null })
      .returning();
    await this.db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, message.projectId));
    return toMessage(row!);
  }

  async listMessages(ownerId: string, projectId: string, limit = 200): Promise<ChatMessage[]> {
    const rows = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.projectId, projectId), eq(messages.ownerId, ownerId)))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    return rows.reverse().map(toMessage);
  }

  async addVersion(ownerId: string, version: Omit<Version, "id" | "number" | "createdAt">): Promise<Version> {
    if (!(await this.owns(ownerId, version.projectId))) throw new Error("Project not found");
    // number = max + 1; the unique index catches a concurrent insert, so retry.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const [row] = await this.db
          .insert(projectVersions)
          .values({
            projectId: version.projectId,
            ownerId,
            summary: version.summary,
            files: version.files,
            number: sql`(select coalesce(max(${projectVersions.number}), 0) + 1 from ${projectVersions} where ${projectVersions.projectId} = ${version.projectId})`,
          })
          .returning();
        return row as Version;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
    throw new Error("unreachable");
  }

  async versionStats(ownerId: string, projectId: string): Promise<{ count: number; lastAt: Date | null }> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int`, lastAt: sql<string | null>`max(${projectVersions.createdAt})` })
      .from(projectVersions)
      .where(and(eq(projectVersions.projectId, projectId), eq(projectVersions.ownerId, ownerId)));
    return { count: Number(row?.count ?? 0), lastAt: row?.lastAt ? new Date(row.lastAt) : null };
  }

  async listVersions(ownerId: string, projectId: string): Promise<VersionSummary[]> {
    return this.db
      .select({
        id: projectVersions.id,
        projectId: projectVersions.projectId,
        number: projectVersions.number,
        summary: projectVersions.summary,
        createdAt: projectVersions.createdAt,
      })
      .from(projectVersions)
      .where(and(eq(projectVersions.projectId, projectId), eq(projectVersions.ownerId, ownerId)))
      .orderBy(desc(projectVersions.number))
      .limit(200);
  }

  async getVersion(ownerId: string, projectId: string, number: number): Promise<Version | null> {
    const [row] = await this.db
      .select()
      .from(projectVersions)
      .where(and(eq(projectVersions.projectId, projectId), eq(projectVersions.ownerId, ownerId), eq(projectVersions.number, number)))
      .limit(1);
    return (row as Version | undefined) ?? null;
  }

  async latestVersion(ownerId: string, projectId: string): Promise<Version | null> {
    const [row] = await this.db
      .select()
      .from(projectVersions)
      .where(and(eq(projectVersions.projectId, projectId), eq(projectVersions.ownerId, ownerId)))
      .orderBy(desc(projectVersions.number))
      .limit(1);
    return (row as Version | undefined) ?? null;
  }
}

function toMessage(row: typeof messages.$inferSelect): ChatMessage {
  return {
    id: row.id,
    projectId: row.projectId,
    role: row.role,
    text: row.text,
    status: row.status ?? undefined,
    versionNumber: row.versionNumber ?? undefined,
    createdAt: row.createdAt,
  };
}


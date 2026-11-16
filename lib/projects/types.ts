export interface Project {
  id: string;
  ownerId: string;
  name: string;
  locale: "en" | "am";
  /** The template (preset id) the site started from, if any. */
  templateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ChatRole = "owner" | "assistant";

export interface ChatMessage {
  id: string;
  projectId: string;
  role: ChatRole;
  text: string;
  /** For assistant messages: what the run did. */
  status?: "changed" | "answered" | "failed";
  versionNumber?: number;
  createdAt: Date;
}

export interface Version {
  id: string;
  projectId: string;
  /** 1, 2, 3 ... per project */
  number: number;
  summary: string;
  /** Editable files (src/**, public text files). */
  files: Record<string, string>;
  createdAt: Date;
}

export type VersionSummary = Omit<Version, "files">;

/**
 * Project data access. Every method takes the owner id and only touches that owner's rows
 * (tenant isolation). Memory implementation below; Postgres in lib/db (Slice 2).
 */
export interface ProjectStore {
  createProject(ownerId: string, input: { name: string; locale: "en" | "am"; templateId?: string | null }): Promise<Project>;
  getProject(ownerId: string, projectId: string): Promise<Project | null>;
  listProjects(ownerId: string): Promise<Project[]>;
  renameProject(ownerId: string, projectId: string, name: string): Promise<void>;
  addMessage(ownerId: string, message: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage>;
  listMessages(ownerId: string, projectId: string, limit?: number): Promise<ChatMessage[]>;
  addVersion(ownerId: string, version: Omit<Version, "id" | "number" | "createdAt">): Promise<Version>;
  listVersions(ownerId: string, projectId: string): Promise<VersionSummary[]>;
  /** How many versions and when the newest was saved (one small query). */
  versionStats(ownerId: string, projectId: string): Promise<{ count: number; lastAt: Date | null }>;
  getVersion(ownerId: string, projectId: string, number: number): Promise<Version | null>;
  latestVersion(ownerId: string, projectId: string): Promise<Version | null>;
}

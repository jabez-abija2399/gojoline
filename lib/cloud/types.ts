import type { MessageStatus } from "@/lib/dashboard/message-status";
import type { FormDef } from "./forms";

export interface PublicSite {
  siteId: string;
  projectId: string;
  ownerId: string;
  siteKey: string | null;
  status: string;
  url: string | null;
  customDomain: string | null;
  /** The owner took the site offline (resting): forms stop and the site shows a resting page. */
  offline: boolean;
}

export interface Submission {
  id: string;
  siteId: string;
  projectId: string;
  ownerId: string;
  formKey: string;
  kind: string;
  data: Record<string, string>;
  lang: string | null;
  /** Kept from before statuses (2026-11-16); `status` is what the dashboard shows. */
  readAt: Date | null;
  status: MessageStatus;
  createdAt: Date;
}

export interface CloudStore {
  /** Public lookup by the site id baked into the published site (the project id). */
  publicSite(projectId: string): Promise<PublicSite | null>;
  saveForms(siteId: string, forms: FormDef[]): Promise<void>;
  getForm(siteId: string, formKey: string): Promise<FormDef | null>;
  addSubmission(input: Omit<Submission, "id" | "readAt" | "status" | "createdAt">): Promise<Submission>;
  /** Owner-scoped. */
  listSubmissions(ownerId: string, projectId: string, limit?: number): Promise<Submission[]>;
  /** Owner-scoped; only moves `canMove` allows. Returns how many changed. */
  setStatus(ownerId: string, projectId: string, ids: string[], status: MessageStatus): Promise<number>;
  /** Owner-scoped; true when it existed. */
  deleteSubmission(ownerId: string, projectId: string, id: string): Promise<boolean>;
  /** Owner-scoped exact counts (no row limit); `waiting` is the messages still New. */
  countSubmissions(ownerId: string, projectId: string): Promise<{ total: number; waiting: number }>;
  /** Owner-scoped number of answers per Addis Ababa day since a moment ("YYYY-MM-DD"), counted by the database. */
  answersPerDay(ownerId: string, projectId: string, since: Date): Promise<{ day: string; count: number }[]>;
}

/** Tells the owner about a new submission (Telegram in Slice 5). */
export interface SubmissionNotifier {
  notify(submission: Submission, form: FormDef): Promise<void>;
}

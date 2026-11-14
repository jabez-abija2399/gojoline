import type { FormDef } from "./forms";

export interface PublicSite {
  siteId: string;
  projectId: string;
  ownerId: string;
  siteKey: string | null;
  status: string;
  url: string | null;
  customDomain: string | null;
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
  readAt: Date | null;
  createdAt: Date;
}

export interface CloudStore {
  /** Public lookup by the site id baked into the published site (the project id). */
  publicSite(projectId: string): Promise<PublicSite | null>;
  saveForms(siteId: string, forms: FormDef[]): Promise<void>;
  getForm(siteId: string, formKey: string): Promise<FormDef | null>;
  addSubmission(input: Omit<Submission, "id" | "readAt" | "createdAt">): Promise<Submission>;
  /** Owner-scoped. */
  listSubmissions(ownerId: string, projectId: string, limit?: number): Promise<Submission[]>;
  markRead(ownerId: string, projectId: string, ids: string[]): Promise<void>;
}

/** Tells the owner about a new submission (Telegram in Slice 5). */
export interface SubmissionNotifier {
  notify(submission: Submission, form: FormDef): Promise<void>;
}

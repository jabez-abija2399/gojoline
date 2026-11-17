/** Owner feedback (2026-11-17): what owners send us, and what the team answers. Zod-free so client code can import it. */
export const FEEDBACK_TYPES = ["idea", "problem", "praise", "question"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_STATUSES = ["new", "seen", "planned", "done", "wont_do"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const DEVICES = ["phone", "tablet", "computer"] as const;
export type Device = (typeof DEVICES)[number];

export const MESSAGE_MIN = 5;
export const MESSAGE_MAX = 2000;
export const REPLY_MAX = 2000;
export const USER_AGENT_MAX = 200;
/** Same as payment receipts: below the hosting platform's ~4.5 MB request limit. */
export const MAX_SCREENSHOT_BYTES = 4_000_000;
/** Per owner per hour, and per network per hour (several owners can share one network). */
export const PER_OWNER_HOUR = 10;
export const PER_OWNER_DAY = 20;
export const PER_IP_HOUR = 30;
/** Stored screenshot bytes per owner (screenshots are cleared after RETENTION_DAYS), and per day. */
export const SHOT_BYTES_TOTAL = 20 * 1024 * 1024;
export const SHOT_BYTES_DAY = 10 * 1024 * 1024;
export const RETENTION_DAYS = 90;
/** Audit entries keep the reply's first characters only. */
export const AUDIT_REPLY_MAX = 500;

export interface FeedbackInput {
  type: FeedbackType;
  message: string;
  rating: number | null;
  /** The page it was sent from (a path on our own site, never a full URL). */
  page: string | null;
  locale: "en" | "am";
  device: Device;
  userAgent: string | null;
}

export interface Feedback extends FeedbackInput {
  id: string;
  ownerId: string;
  hasScreenshot: boolean;
  status: FeedbackStatus;
  reply: string | null;
  repliedAt: Date | null;
  /** When the owner saw the reply; null while it is unread (or there is no reply). */
  replyReadAt: Date | null;
  createdAt: Date;
}

/** What the admin sees about who sent it. */
export interface FeedbackOwner {
  name: string;
  contact: string;
  plan: "free" | "starter" | "business";
}

export interface AdminFeedback extends Feedback {
  owner: FeedbackOwner | null;
}

export interface FeedbackFilter {
  status?: FeedbackStatus;
  type?: FeedbackType;
}

export type ShotSize = "full" | "thumb";

export type FeedbackUpdate = { outcome: "not_found" } | { outcome: "ok" | "unchanged"; from: FeedbackStatus; to: FeedbackStatus; replyChanged: boolean };

export interface FeedbackStore {
  add(ownerId: string, input: FeedbackInput, shot: { full: Buffer; thumb: Buffer } | null): Promise<Feedback>;
  /** The owner's own items, newest first. */
  listForOwner(ownerId: string, limit: number): Promise<Feedback[]>;
  /** Replies the owner hasn't seen yet. */
  unreadReplies(ownerId: string): Promise<number>;
  /** The owner opened My feedback: every reply so far counts as seen. */
  markRepliesRead(ownerId: string): Promise<void>;
  /** The screenshot or its thumbnail, for its owner (ownerId) or an admin (null). */
  screenshot(id: string, ownerId: string | null, size: ShotSize): Promise<Buffer | null>;
  /** Bytes of the owner's screenshots still stored, all of them or those sent since `since`. */
  screenshotBytes(ownerId: string, since: Date | null): Promise<number>;
  /** Clears screenshots and thumbnails sent before `before`; returns how many. */
  purgeScreenshots(before: Date): Promise<number>;
  /** For admins: one item by id (any owner). */
  get(id: string): Promise<Feedback | null>;
  /** For admins: every owner's items, newest first. */
  adminList(filter: FeedbackFilter, limit: number): Promise<AdminFeedback[]>;
  countByStatus(): Promise<Record<FeedbackStatus, number>>;
  /**
   * The admin's save, as one atomic change with its audit entries: a non-empty reply that differs
   * from the stored one replaces it (unread for the owner) and moves New to Seen; then the status.
   * Audited as `feedback.reply` (length and the first 500 characters) and `feedback.status` (from, to).
   */
  update(id: string, adminId: string, input: { status: FeedbackStatus; reply: string }): Promise<FeedbackUpdate>;
}

export const emptyCounts = (): Record<FeedbackStatus, number> => ({ new: 0, seen: 0, planned: 0, done: 0, wont_do: 0 });

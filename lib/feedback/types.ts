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
export const PER_IP_HOUR = 30;

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

export interface FeedbackStore {
  add(ownerId: string, input: FeedbackInput, screenshot: Buffer | null): Promise<Feedback>;
  /** The owner's own items, newest first. */
  listForOwner(ownerId: string, limit: number): Promise<Feedback[]>;
  /** Replies the owner hasn't seen yet. */
  unreadReplies(ownerId: string): Promise<number>;
  /** The owner opened My feedback: every reply so far counts as seen. */
  markRepliesRead(ownerId: string): Promise<void>;
  /** The screenshot, for its owner (ownerId) or an admin (null). */
  screenshot(id: string, ownerId: string | null): Promise<Buffer | null>;
  /** For admins: one item by id (any owner). */
  get(id: string): Promise<Feedback | null>;
  /** For admins: every owner's items, newest first. */
  adminList(filter: FeedbackFilter, limit: number): Promise<AdminFeedback[]>;
  countByStatus(): Promise<Record<FeedbackStatus, number>>;
  /** Returns the status before the change, or null when there is no such item. */
  setStatus(id: string, status: FeedbackStatus): Promise<FeedbackStatus | null>;
  /** Saves (or replaces) the team's reply; it shows as unread to the owner. False when missing. */
  reply(id: string, text: string, adminId: string): Promise<boolean>;
}

export const emptyCounts = (): Record<FeedbackStatus, number> => ({ new: 0, seen: 0, planned: 0, done: 0, wont_do: 0 });

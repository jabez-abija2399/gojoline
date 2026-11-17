import type { FeedbackStatus, FeedbackStore } from "./types";

export interface FeedbackAdminDeps {
  store: FeedbackStore;
  audit: (e: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) => Promise<void>;
}

export type FeedbackUpdate = "ok" | "unchanged" | "not_found";

/**
 * One save from the admin's card: a new status and/or a reply. Each change is its own audit entry
 * (`feedback.status` with from/to, `feedback.reply` with its length, never the text twice).
 * A reply to an item still New moves it to Seen, so nobody answers and leaves it looking untouched.
 */
export async function updateFeedback(deps: FeedbackAdminDeps, adminId: string, id: string, input: { status: FeedbackStatus; reply: string }): Promise<FeedbackUpdate> {
  const current = await deps.store.get(id);
  if (!current) return "not_found";
  const reply = input.reply.trim();
  // An empty box keeps the reply already sent (replies are never taken back silently).
  const replyChanged = reply.length > 0 && reply !== (current.reply ?? "");
  let status = input.status;
  let changed = false;
  if (replyChanged) {
    if (!(await deps.store.reply(id, reply, adminId))) return "not_found";
    await deps.audit({ actorId: adminId, action: "feedback.reply", targetType: "feedback", targetId: id, data: { length: reply.length } });
    changed = true;
    if (status === "new") status = "seen";
  }
  const before = await deps.store.setStatus(id, status);
  if (before === null) return "not_found";
  if (before !== status) {
    await deps.audit({ actorId: adminId, action: "feedback.status", targetType: "feedback", targetId: id, data: { from: before, to: status } });
    changed = true;
  }
  return changed ? "ok" : "unchanged";
}

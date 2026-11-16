/** Where the owner is with a message from a visitor. Replaces read/unread (2026-11-16). */
export const MESSAGE_STATUSES = ["new", "replied", "done"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

/** Moves the owner can make: forward one tap at a time, straight to done, or back to new by mistake. */
const MOVES: Record<MessageStatus, readonly MessageStatus[]> = {
  new: ["replied", "done"],
  replied: ["done", "new"],
  done: ["new"],
};

export function canMove(from: MessageStatus, to: MessageStatus): boolean {
  return MOVES[from].includes(to);
}

/** The one-tap next step a message card offers (done messages offer "open again"). */
export function nextStatus(s: MessageStatus): MessageStatus {
  return s === "new" ? "replied" : s === "replied" ? "done" : "new";
}

/** Old rows: unread → New, read → Done (the migration maps them the same way). */
export function statusFromRead(readAt: Date | string | null): MessageStatus {
  return readAt ? "done" : "new";
}

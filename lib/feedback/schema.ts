import { z } from "zod";
import { DEVICES, FEEDBACK_STATUSES, FEEDBACK_TYPES, MESSAGE_MAX, MESSAGE_MIN, REPLY_MAX, USER_AGENT_MAX, type FeedbackInput } from "./types";

/** A path on our own site: starts with one slash, no scheme, host, query or fragment. */
export const pagePath = z
  .string()
  .trim()
  .max(300)
  .regex(/^\/(?!\/)[A-Za-z0-9\-._~/]*$/);

/** Text people type: control characters (other than new lines and tabs) are dropped. */
const typed = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\r\n?/g, "\n");

export const feedbackFields = z.object({
  type: z.enum(FEEDBACK_TYPES),
  message: z.string().transform(typed).pipe(z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX)),
  rating: z.union([z.literal(""), z.coerce.number().int().min(1).max(5)]).optional().transform((v) => (typeof v === "number" ? v : null)),
  // A bad page is dropped, never a reason to lose the message.
  page: z.string().optional().transform((v) => {
    const p = pagePath.safeParse(v ?? "");
    return p.success && p.data ? p.data : null;
  }),
  locale: z.enum(["en", "am"]),
  device: z.enum(DEVICES).catch("computer"),
});

/** Validates the form fields of a feedback submission. The user agent comes from the request headers. */
export function parseFeedback(raw: Record<string, unknown>, userAgent: string | null): { ok: true; data: FeedbackInput } | { ok: false; field: "type" | "message" | "rating" | "locale" } {
  const parsed = feedbackFields.safeParse(raw);
  if (!parsed.success) {
    const f = parsed.error.issues[0]?.path[0];
    return { ok: false, field: f === "type" || f === "rating" || f === "locale" ? f : "message" };
  }
  const ua = userAgent ? typed(userAgent).trim().slice(0, USER_AGENT_MAX) : "";
  return { ok: true, data: { ...parsed.data, userAgent: ua || null } };
}

export const adminFeedbackInput = z.object({
  id: z.uuid(),
  status: z.enum(FEEDBACK_STATUSES),
  reply: z.string().transform(typed).pipe(z.string().trim().max(REPLY_MAX)),
  lang: z.enum(["en", "am"]),
});

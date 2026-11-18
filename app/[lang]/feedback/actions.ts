"use server";

import { currentUser } from "@/lib/auth/session";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";

/** My feedback was shown: the signed-in owner's replies so far count as seen (their own only). */
export async function markFeedbackRead(): Promise<void> {
  const user = await currentUser();
  if (!user) return;
  try {
    await services().feedback.markRepliesRead(user.id);
  } catch (error) {
    reportError("feedback read failed", error);
  }
}

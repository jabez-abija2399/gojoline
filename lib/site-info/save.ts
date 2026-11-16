import "server-only";
import { services } from "@/lib/server/services";

/**
 * Words an owner puts live from the dashboard are checked like a publish: a hit is refused
 * (422 `blocked`) and written to the audit log for the moderation trail.
 */
export async function blockedText(texts: string[], ownerId: string, projectId: string, what: "business" | "seo"): Promise<boolean> {
  const svc = services();
  const verdict = await svc.checkText(texts, { userId: ownerId, projectId });
  if (verdict.ok) return false;
  await svc.billing
    .store()
    .audit({ actorId: ownerId, action: `${what}.blocked`, targetType: "project", targetId: projectId, data: { reasons: verdict.reasons } })
    .catch(() => undefined);
  return true;
}

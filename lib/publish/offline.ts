import "server-only";
import { reportError } from "@/lib/observability/report";
import type { Site } from "@/lib/sites/types";
import { publisherFor } from "./hosts";
import type { PublishDeps } from "./service";

export type OfflineOutcome = { ok: true; site: Site } | { ok: false; error: "not_found" | "not_live" | "taken_down" | "busy" };

/**
 * The owner's "Take site offline" / "Put back online". The database flag comes first: forms
 * stop and the public Data API says the site is resting, which the live site shows. Then the
 * host is told, where it can (Cloudflare: the Worker answers with a resting page). An admin's
 * takedown is a different state and can't be undone here.
 */
export async function setSiteOffline(deps: Pick<PublishDeps, "sites" | "publisher" | "legacy" | "lock">, ownerId: string, projectId: string, offline: boolean): Promise<OfflineOutcome> {
  const site = await deps.sites.getByProject(ownerId, projectId);
  if (!site) return { ok: false, error: "not_found" };
  if (site.status === "taken_down") return { ok: false, error: "taken_down" };
  if (site.status !== "published") return { ok: false, error: "not_live" };
  const token = await deps.lock.acquire(`project:${projectId}`, 60_000);
  if (!token) return { ok: false, error: "busy" };
  try {
    const updated = await deps.sites.setOffline(ownerId, projectId, offline);
    if (!updated) return { ok: false, error: "not_live" };
    if (updated.providerProjectId) {
      try {
        await publisherFor(updated, deps.publisher, deps.legacy).setResting?.(updated.providerProjectId, offline);
      } catch (e) {
        // The live site's own check still shows the resting page; the next switch retries.
        reportError("resting switch failed", e, { projectId });
      }
    }
    return { ok: true, site: updated };
  } finally {
    await deps.lock.release(`project:${projectId}`, token);
  }
}

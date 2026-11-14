import "server-only";
import type { BuilderDeps } from "@/lib/builder/service";
import { publishSite, type PublishDeps } from "@/lib/publish/service";
import { applyListEdit, type ListEdit } from "./lists";

export type ContentEditResult =
  | { ok: true; versionNumber: number; republished: boolean; url: string | null }
  | { ok: false; error: "not_found" | "no_version" | "invalid" | "name_required" | "busy" | "build_failed" | "failed" };

/**
 * Saves an owner's list edit (prices, items) as a new version after a real build check, then
 * republishes automatically if the site is live, so the change reaches customers right away.
 */
export async function saveListEdit(
  deps: BuilderDeps,
  publish: PublishDeps | null,
  user: { id: string; verified: boolean },
  projectId: string,
  edit: ListEdit,
): Promise<ContentEditResult> {
  const project = await deps.store.getProject(user.id, projectId);
  if (!project) return { ok: false, error: "not_found" };
  const latest = await deps.store.latestVersion(user.id, projectId);
  if (!latest?.files["src/site.json"]) return { ok: false, error: "no_version" };
  const applied = applyListEdit(latest.files["src/site.json"], edit);
  if (!applied.ok) return { ok: false, error: applied.error === "not_found" ? "invalid" : applied.error };

  // Nothing changed: no build, no version, no republish.
  if (applied.json === latest.files["src/site.json"]) return { ok: true, versionNumber: latest.number, republished: false, url: null };
  const files = { ...latest.files, "src/site.json": applied.json };
  const token = await deps.lock.acquire(`project:${projectId}`, 6 * 60_000);
  if (!token) return { ok: false, error: "busy" };
  let versionNumber: number;
  try {
    const sandbox = await deps.sandboxes.open(projectId, files);
    if (deps.assets) await sandbox.writeAssets(await deps.assets.files(user.id, projectId));
    const build = await sandbox.runBuild();
    if (!build.ok) {
      // Put the sandbox back to the last good version.
      await sandbox.restoreFiles(latest.files);
      return { ok: false, error: "build_failed" };
    }
    versionNumber = (await deps.store.addVersion(user.id, { projectId, summary: `list:${edit.key}`, files })).number;
  } catch {
    return { ok: false, error: "failed" };
  } finally {
    await deps.lock.release(`project:${projectId}`, token);
  }

  const site = publish ? await publish.sites.getByProject(user.id, projectId) : null;
  if (publish && site?.status === "published") {
    const r = await publishSite(publish, user, projectId, site.slug);
    return { ok: true, versionNumber, republished: r.ok, url: r.ok ? r.site.url : site.url };
  }
  return { ok: true, versionNumber, republished: false, url: null };
}

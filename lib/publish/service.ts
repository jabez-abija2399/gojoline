import "server-only";
import type { Lock } from "@/lib/lock";
import type { ProjectStore } from "@/lib/projects/types";
import type { PublishFile, PublishProvider } from "@/lib/providers/publish/types";
import type { SandboxProvider } from "@/lib/providers/sandbox/types";
import { checkSlug, suggestSlug } from "@/lib/sites/slug";
import type { Site, SiteStore } from "@/lib/sites/types";
import { publishedSiteHeaders, scanBuiltSite, type ScanIssue } from "./scan";

/** Extra checks before a site goes public (content safety is added in Slice 7). */
export interface PublishGuard {
  check(input: { files: PublishFile[]; projectId: string; ownerId: string }): Promise<{ ok: true } | { ok: false; reasons: string[] }>;
}

export interface PublishDeps {
  store: ProjectStore;
  sites: SiteStore;
  sandboxes: SandboxProvider;
  publisher: PublishProvider;
  lock: Lock;
  appUrl: string;
  dataApiOrigin?: string;
  guards?: PublishGuard[];
}

export type PublishError =
  | "not_found"
  | "no_version"
  | "unverified"
  | "slug_format"
  | "slug_reserved"
  | "slug_taken"
  | "busy"
  | "taken_down"
  | "build_failed"
  | "blocked"
  | "failed";

export type PublishOutcome =
  | { ok: true; site: Site }
  | { ok: false; error: PublishError; issues?: ScanIssue[]; reasons?: string[] };

export interface PublishUser {
  id: string;
  verified: boolean;
}

/** What the publish dialog shows before the owner publishes. */
export async function publishInfo(deps: PublishDeps, user: PublishUser, projectId: string) {
  const project = await deps.store.getProject(user.id, projectId);
  if (!project) return null;
  const site = await deps.sites.getByProject(user.id, projectId);
  const slug = site?.slug ?? suggestSlug(project.name, `site-${projectId.slice(0, 8)}`);
  return {
    slug,
    url: site?.url ?? null,
    status: site?.status ?? null,
    publishedVersion: site?.publishedVersion ?? null,
    prefix: deps.publisher.urlFor("SLUG").split("SLUG")[0]!,
    suffix: deps.publisher.urlFor("SLUG").split("SLUG")[1]!,
  };
}

export async function publishSite(deps: PublishDeps, user: PublishUser, projectId: string, requestedSlug: string): Promise<PublishOutcome> {
  const project = await deps.store.getProject(user.id, projectId);
  if (!project) return { ok: false, error: "not_found" };
  // Verification before publish (Phase 1 trust rule).
  if (!user.verified) return { ok: false, error: "unverified" };
  const existing = await deps.sites.getByProject(user.id, projectId);
  if (existing?.status === "taken_down") return { ok: false, error: "taken_down" };

  // The address can't change after the first publish (links people saved keep working).
  const slug = existing?.slug ?? requestedSlug.trim().toLowerCase();
  const problem = checkSlug(slug);
  if (problem) return { ok: false, error: problem === "format" ? "slug_format" : "slug_reserved" };
  if (await deps.sites.slugTaken(slug, projectId)) return { ok: false, error: "slug_taken" };

  const latest = await deps.store.latestVersion(user.id, projectId);
  if (!latest) return { ok: false, error: "no_version" };

  const token = await deps.lock.acquire(`project:${projectId}`, 6 * 60_000);
  if (!token) return { ok: false, error: "busy" };
  try {
    const url = deps.publisher.urlFor(slug);
    const sandbox = await deps.sandboxes.open(projectId, latest.files);
    const build = await sandbox.buildForPublish({
      VITE_SITE_URL: url,
      VITE_SITE_ID: projectId,
      VITE_REPORT_URL: `${deps.appUrl.replace(/\/$/, "")}/${project.locale}/report?site=${encodeURIComponent(slug)}`,
      ...(deps.dataApiOrigin ? { VITE_DATA_API_URL: deps.dataApiOrigin } : {}),
    });
    if (!build.ok) {
      console.warn("publish build failed", projectId, build.output.slice(-1500));
      return { ok: false, error: "build_failed" };
    }

    const issues = scanBuiltSite(build.files, { allowedFormOrigins: deps.dataApiOrigin ? [deps.dataApiOrigin] : [] });
    if (issues.length) return { ok: false, error: "blocked", issues };
    for (const guard of deps.guards ?? []) {
      const verdict = await guard.check({ files: build.files, projectId, ownerId: user.id });
      if (!verdict.ok) return { ok: false, error: "blocked", reasons: verdict.reasons };
    }

    const result = await deps.publisher.publish({
      slug,
      files: build.files,
      headers: publishedSiteHeaders({ dataApiOrigin: deps.dataApiOrigin }),
    });
    const site = await deps.sites.savePublished(user.id, {
      projectId,
      slug,
      provider: deps.publisher.name,
      providerProjectId: result.providerProjectId,
      url: result.url,
      publishedVersion: latest.number,
      lastDeploymentId: result.deploymentId,
      publishedAt: new Date(),
    });
    return { ok: true, site };
  } catch (error) {
    console.error("publish failed", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "failed" };
  } finally {
    await deps.lock.release(`project:${projectId}`, token);
  }
}

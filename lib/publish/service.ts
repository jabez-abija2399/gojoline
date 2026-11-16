import "server-only";
import { movedPage, noticeTargets } from "./hosts";
import { reportError } from "@/lib/observability/report";
import { extractForms } from "@/lib/cloud/forms";
import type { CloudStore } from "@/lib/cloud/types";
import type { Lock } from "@/lib/lock";
import type { AssetStore } from "@/lib/cloud/assets";
import type { EntitlementsResolver } from "@/lib/billing/entitlements";
import type { ProjectStore } from "@/lib/projects/types";
import type { PublishFile, PublishProvider } from "@/lib/providers/publish/types";
import type { SandboxProvider } from "@/lib/providers/sandbox/types";
import { checkSlug, suggestSlug } from "@/lib/sites/slug";
import { libraryPhoto } from "@/lib/template/files";
import { PRESET_IDS, presetSiteJson } from "@/lib/template/presets";
import type { Site, SiteStore } from "@/lib/sites/types";
import { takenDownPage } from "@/lib/safety/takedown";
import { publishedSiteHeaders, scanBuiltSite, type ScanIssue } from "./scan";

/** Extra checks before a site goes public (content safety is added in Slice 7). */
export interface PublishGuard {
  /** `source` is the version's editable files (site.json holds every word the site can show). */
  check(input: { files: PublishFile[]; source: Record<string, string>; projectId: string; ownerId: string }): Promise<{ ok: true } | { ok: false; reasons: string[] }>;
}

export interface PublishDeps {
  store: ProjectStore;
  sites: SiteStore;
  sandboxes: SandboxProvider;
  publisher: PublishProvider;
  /**
   * The host sites were published with before `publisher` (the Vercel fallback once Cloudflare
   * is set up). A site still there moves on its next publish; its old address then forwards.
   */
  legacy?: PublishProvider | null;
  lock: Lock;
  appUrl: string;
  /** Origin of the public Data API the site's forms post to (defaults to the app's origin). */
  dataApiOrigin?: string;
  guards?: PublishGuard[];
  /** Where form definitions are stored at publish time. */
  cloud?: CloudStore;
  assets?: AssetStore;
  /** Records blocked publishes (moderation trail). */
  audit?: (entry: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) => Promise<void>;
  /** Plan limits (site count, badge). Without it: Free limits. */
  entitlements?: EntitlementsResolver;
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
  | "plan_limit"
  | "unfinished"
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
  // Example details from a template (placeholder phone, [bracketed] text) must not go live.
  if (hasExampleDetails(latest.files["src/site.json"] ?? "")) return { ok: false, error: "unfinished" };
  const plan = deps.entitlements ? await deps.entitlements(user.id) : null;
  const firstLive = (existing?.status ?? "pending") !== "published";
  // A new live site: one at a time per owner, so parallel publishes can't pass the site limit together.
  const ownerToken = firstLive ? await deps.lock.acquire(`publish-owner:${user.id}`, 6 * 60_000) : null;
  if (firstLive && !ownerToken) return { ok: false, error: "busy" };
  try {
    if (firstLive && (await deps.sites.countPublished(user.id, projectId)) >= (plan?.maxSites ?? 1)) {
      return { ok: false, error: "plan_limit" };
    }
    return await deployLocked(deps, user, projectId, { existing, slug, latest, plan, project });
  } finally {
    if (ownerToken) await deps.lock.release(`publish-owner:${user.id}`, ownerToken);
  }
}

async function deployLocked(
  deps: PublishDeps,
  user: PublishUser,
  projectId: string,
  ctx: { existing: Site | null; slug: string; latest: NonNullable<Awaited<ReturnType<ProjectStore["latestVersion"]>>>; plan: Awaited<ReturnType<EntitlementsResolver>> | null; project: NonNullable<Awaited<ReturnType<ProjectStore["getProject"]>>> },
): Promise<PublishOutcome> {
  const { existing, slug, latest, plan, project } = ctx;
  // Claim the address in our database before anything is deployed (atomic, unique).
  if (!existing && !(await deps.sites.reserve(user.id, projectId, slug, deps.publisher.name))) return { ok: false, error: "slug_taken" };

  const token = await deps.lock.acquire(`project:${projectId}`, 6 * 60_000);
  if (!token) return { ok: false, error: "busy" };
  try {
    const reserved = existing ?? (await deps.sites.getByProject(user.id, projectId));
    const apiOrigin = deps.dataApiOrigin ?? new URL(deps.appUrl).origin;
    const url = deps.publisher.urlFor(slug);
    const sandbox = await deps.sandboxes.open(projectId, latest.files);
    if (deps.assets) await sandbox.writeAssets(await deps.assets.files(user.id, projectId));
    const build = await sandbox.buildForPublish({
      VITE_SITE_URL: url,
      VITE_SITE_ID: projectId,
      VITE_REPORT_URL: `${deps.appUrl.replace(/\/$/, "")}/${project.locale}/report?site=${encodeURIComponent(slug)}`,
      VITE_DATA_API_URL: apiOrigin,
      VITE_BADGE: plan && !plan.badge ? "0" : "1",
      ...(reserved?.siteKey ? { VITE_SITE_KEY: reserved.siteKey } : {}),
    });
    if (!build.ok) {
      console.warn("publish build failed", projectId, build.output.slice(-1500));
      return { ok: false, error: "build_failed" };
    }

    // Sample photos are published from our own library, never from the sandbox's copy: a name
    // that isn't in the library is dropped.
    build.files = build.files.flatMap((f) => {
      const name = /^stock\/([a-z0-9-]+\.webp)$/.exec(f.path)?.[1];
      if (!f.path.startsWith("stock/")) return [f];
      const data = name ? libraryPhoto(name) : null;
      return data ? [{ path: f.path, data }] : [];
    });
    const issues = scanBuiltSite(build.files, { allowedFormOrigins: [apiOrigin] });
    if (issues.length) return { ok: false, error: "blocked", issues };
    for (const guard of deps.guards ?? []) {
      const verdict = await guard.check({ files: build.files, source: latest.files, projectId, ownerId: user.id });
      if (!verdict.ok) {
        await deps.audit?.({ actorId: user.id, action: "publish.blocked", targetType: "project", targetId: projectId, data: { reasons: verdict.reasons, version: latest.number } }).catch(() => undefined);
        return { ok: false, error: "blocked", reasons: verdict.reasons };
      }
    }

    // An admin may have taken the site down while this build ran.
    if ((await deps.sites.getByProject(user.id, projectId))?.status === "taken_down") return { ok: false, error: "taken_down" };
    const result = await deps.publisher.publish({
      slug,
      files: build.files,
      headers: publishedSiteHeaders({ dataApiOrigin: apiOrigin }),
      providerProjectId: existing?.providerProjectId ?? null,
    });
    // A site moving hosts keeps its old project on record until the old address forwards.
    const moving = Boolean(existing?.providerProjectId) && existing!.provider !== deps.publisher.name;
    const legacyProjectId = moving ? existing!.providerProjectId : (existing?.legacyProjectId ?? null);
    const site = await deps.sites.savePublished(user.id, {
      projectId,
      slug,
      provider: deps.publisher.name,
      providerProjectId: result.providerProjectId,
      legacyProjectId,
      url: result.url,
      publishedVersion: latest.number,
      lastDeploymentId: result.deploymentId,
      publishedAt: new Date(),
    });
    if (legacyProjectId && deps.legacy) {
      // The old address forwards to the new one (same path) and stops showing old content.
      // A failure is retried on the next publish; until then takedowns also reach the old host.
      const page = Buffer.from(movedPage(result.url));
      try {
        await deps.legacy.publish({ slug, files: [{ path: "index.html", data: page }, { path: "404.html", data: page }], headers: publishedSiteHeaders(), providerProjectId: legacyProjectId, redirectTo: result.url });
        await deps.legacy.restrictOldDeployments?.(legacyProjectId);
        await deps.sites.clearLegacy(user.id, projectId);
      } catch (e) {
        reportError("old host forward failed", e, { projectId });
      }
    }
    // Forms on the live site accept answers only in the shape published here.
    await deps.cloud?.saveForms(site.id, extractForms(latest.files["src/site.json"] ?? ""));
    return { ok: true, site };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg === "Site is taken down") {
      // Taken down during the deploy: put the notice back over what was just deployed.
      const site = await deps.sites.getByProject(user.id, projectId);
      if (site) {
        // The files just went to deps.publisher (whatever the record says), and the site may
        // still live on the old host too: the notice goes everywhere it could be seen.
        const files = [{ path: "index.html", data: Buffer.from(takenDownPage()) }, { path: "404.html", data: Buffer.from(takenDownPage()) }];
        const targets = noticeTargets(site, deps.publisher, deps.legacy, { includeCurrent: true });
        for (const t of targets) {
          try {
            const r = await t.host.publish({ slug, files, headers: publishedSiteHeaders(), providerProjectId: t.projectId });
            await t.host.restrictOldDeployments?.(r.providerProjectId);
          } catch (e) {
            reportError("takedown redeploy failed", e, { projectId, host: t.host.name });
          }
        }
      }
      return { ok: false, error: "taken_down" };
    }
    reportError("publish failed", error, { projectId });
    return { ok: false, error: msg === "slug_taken" ? "slug_taken" : "failed" };
  } finally {
    await deps.lock.release(`project:${projectId}`, token);
  }
}

/** Telegram names the starter templates use as examples. Anyone could register them and receive a site's customers. */
export const EXAMPLE_TELEGRAM = /^@?(yourbusiness|yourchurch|bolebunahouse)$/i;

type Json = Record<string, unknown>;
const isStock = (image: unknown) => typeof (image as Json | undefined)?.src === "string" && ((image as Json).src as string).startsWith("/stock/");
const texts = (v: unknown): string[] => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v as Json).filter((x): x is string => typeof x === "string") : []);

/** The reviews, quotes and people a site shows, with whether each sits beside a sample photo. */
function peopleAndQuotes(site: unknown): { text: string; samplePhoto: boolean }[] {
  const out: { text: string; samplePhoto: boolean }[] = [];
  const pages = (site as Json | null)?.pages;
  for (const page of Array.isArray(pages) ? pages : []) {
    for (const s of (Array.isArray((page as Json).sections) ? (page as Json).sections : []) as Json[]) {
      const items = (Array.isArray(s.items) ? s.items : []) as Json[];
      if (s.type === "testimonials") for (const i of items) for (const t of texts(i.quote)) out.push({ text: t, samplePhoto: false });
      if (s.type === "quote") for (const t of texts(s.quote)) out.push({ text: t, samplePhoto: Boolean(s.name) && isStock(s.image) });
      if (s.type === "cards" && s.layout === "people") for (const i of items) for (const t of texts(i.title)) out.push({ text: t, samplePhoto: isStock(i.image) });
      // A giving goal is a claim about real money: the templates' sample goals must not go live.
      const goal = (s.type === "give" ? (s as { goal?: { raised?: { amountMinor?: number }; target?: { amountMinor?: number } } }).goal : undefined);
      if (goal) out.push({ text: `goal:${goal.raised?.amountMinor}/${goal.target?.amountMinor}`, samplePhoto: false });
    }
  }
  return out;
}

let sampleTexts: Set<string> | null = null;
/** Every review, quote and person's name the starter templates show as examples. */
function templateSamples(): Set<string> {
  sampleTexts ??= new Set(PRESET_IDS.flatMap((id) => peopleAndQuotes(JSON.parse(presetSiteJson(id))).map((p) => p.text.trim())));
  return sampleTexts;
}

/**
 * True while a site still shows a template's examples: the placeholder phone or Telegram name,
 * [bracketed] text, a template's invented reviews, quotes, staff or giving goal, or a named person shown
 * with a sample photo (a stranger's face must never stand for someone at the business).
 */
export function hasExampleDetails(siteJson: string): boolean {
  let found = false;
  const walk = (v: unknown) => {
    if (found) return;
    if (typeof v === "string") found = /\+251 ?911 ?000 ?000/.test(v) || /\b0911 ?000 ?000\b/.test(v) || /\[[^\]\n]{2,40}\]/.test(v) || EXAMPLE_TELEGRAM.test(v.trim()) || /t\.me\/(yourbusiness|yourchurch|bolebunahouse)\b/i.test(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  try {
    const site = JSON.parse(siteJson) as unknown;
    walk(site);
    if (found) return true;
    const samples = templateSamples();
    return peopleAndQuotes(site).some((p) => p.samplePhoto || samples.has(p.text.trim()));
  } catch {
    return false;
  }
}

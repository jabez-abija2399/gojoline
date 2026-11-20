import { reportError } from "@/lib/observability/report";
import { buildLiveFiles, type PublishDeps } from "./service";
import { scanBuiltSite } from "./scan";
import { createZip } from "./zip";

/**
 * "Download your website" (Business plan): the published version, built exactly as it went live,
 * as a ZIP of plain HTML, CSS, JavaScript and photos that any web host can serve. Never the
 * template's source code. Forms and bookings in it keep sending answers to Gojoline.
 */
export type DownloadOutcome =
  | { ok: true; zip: Buffer; filename: string }
  | { ok: false; error: "not_found" | "plan_required" | "not_published" | "taken_down" | "busy" | "paused" | "build_failed" | "blocked" | "too_large" | "failed" };

export const README = `Your website from Gojoline
==========================

This folder is your finished website: HTML, CSS, JavaScript and photos.

To put it on another web host:
1. Unzip this file.
2. Upload everything inside the folder (index.html and the other files and folders)
   to your host's public folder (often called public_html or www).
3. Open your address. The home page is index.html.

Contact forms and bookings on your site still send answers to your Gojoline
dashboard and Telegram while your Gojoline account is active.

---

ድረ-ገጽዎ ከጎጆላይን
=================

ይህ አቃፊ የተጠናቀቀው ድረ-ገጽዎ ነው፦ HTML፣ CSS፣ JavaScript እና ፎቶዎች።

በሌላ ማስተናገጃ (hosting) ላይ ለማስቀመጥ፦
1. ፋይሉን ይክፈቱ (unzip)።
2. በአቃፊው ውስጥ ያሉትን ሁሉ (index.html እና ሌሎቹን) ወደ ማስተናገጃዎ
   የሕዝብ አቃፊ (ብዙ ጊዜ public_html ወይም www) ይጫኑ።
3. አድራሻዎን ይክፈቱ። የመነሻ ገጹ index.html ነው።

በድረ-ገጽዎ ላይ ያሉ ቅጾችና ቀጠሮዎች የጎጆላይን መለያዎ ንቁ እስከሆነ ድረስ
መልሶችን ወደ ጎጆላይን ዳሽቦርድዎና ቴሌግራምዎ መላካቸውን ይቀጥላሉ።
`;

/** Bigger archives are refused (memory, and plain ZIP stops at 4 GB). */
export const MAX_DOWNLOAD_BYTES = 300 * 1024 * 1024;

export async function downloadSite(deps: PublishDeps, ownerId: string, projectId: string): Promise<DownloadOutcome> {
  const project = await deps.store.getProject(ownerId, projectId);
  if (!project) return { ok: false, error: "not_found" };
  if (deps.paused) return { ok: false, error: "paused" };
  const plan = deps.entitlements ? await deps.entitlements(ownerId) : null;
  if (!plan?.siteDownload) return { ok: false, error: "plan_required" };
  const site = await deps.sites.getByProject(ownerId, projectId);
  if (site?.status === "taken_down") return { ok: false, error: "taken_down" };
  if (site?.status !== "published" || !site.publishedVersion || !site.url) return { ok: false, error: "not_published" };
  // What is live, not a newer draft: the download matches the site people see.
  const version = await deps.store.getVersion(ownerId, projectId, site.publishedVersion);
  if (!version) return { ok: false, error: "not_published" };

  // One build per site at a time (publishing uses the same lock and sandbox).
  const token = await deps.lock.acquire(`project:${projectId}`, 6 * 60_000);
  if (!token) return { ok: false, error: "busy" };
  try {
    const build = await buildLiveFiles(deps, { ownerId, projectId, locale: project.locale, files: version.files, siteKey: site.siteKey, url: site.url, slug: site.slug });
    // The preview sandbox is shared: put the owner's newest draft back for their open preview.
    const latest = await deps.store.latestVersion(ownerId, projectId);
    if (latest && latest.number !== version.number) await deps.sandboxes.open(projectId, latest.files).catch((e: unknown) => reportError("restore after download failed", e, { projectId }));
    if (!build.ok) {
      console.warn("download build failed", projectId, build.output.slice(-1500));
      return { ok: false, error: "build_failed" };
    }
    // The same checks as publishing (photos and settings may be newer than the last publish).
    const apiOrigin = deps.dataApiOrigin ?? new URL(deps.appUrl).origin;
    if (scanBuiltSite(build.files, { allowedFormOrigins: [apiOrigin] }).length) return { ok: false, error: "blocked" };
    for (const guard of deps.guards ?? []) {
      if (!(await guard.check({ files: build.files, source: version.files, projectId, ownerId })).ok) return { ok: false, error: "blocked" };
    }
    // Taken down while it built: nothing to hand out.
    if ((await deps.sites.getByProject(ownerId, projectId))?.status === "taken_down") return { ok: false, error: "taken_down" };
    const size = build.files.reduce((n, f) => n + f.data.length, 0);
    if (size > MAX_DOWNLOAD_BYTES) return { ok: false, error: "too_large" };
    const zip = createZip([{ path: "README.txt", data: Buffer.from(README) }, ...build.files.map((f) => ({ path: f.path, data: f.data }))]);
    return { ok: true, zip, filename: `${site.slug}-website.zip` };
  } catch (e) {
    reportError("site download failed", e, { projectId });
    return { ok: false, error: "failed" };
  } finally {
    await deps.lock.release(`project:${projectId}`, token);
  }
}

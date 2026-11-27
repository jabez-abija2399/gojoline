import { getMessages } from "@/lib/i18n";
import type { PublishProvider } from "@/lib/providers/publish/types";
import { NOTICE_STYLE, escapeHtml } from "./notice";

/** The host a site currently lives on (the legacy one until it has moved). Throws if that host isn't configured. */
export function publisherFor(site: { provider: string }, publisher: PublishProvider, legacy?: PublishProvider | null): PublishProvider {
  if (site.provider === publisher.name) return publisher;
  if (legacy?.name === site.provider) return legacy;
  throw new Error(`no_host:${site.provider}`);
}

/**
 * Every place a site's content could be public, for a takedown notice: its current host, the
 * old host while the move isn't confirmed, and (`includeCurrent`, a takedown during a publish)
 * the new host the publish was writing to.
 */
export function noticeTargets(
  site: { slug: string; provider: string; providerProjectId: string | null; legacyProjectId?: string | null },
  publisher: PublishProvider,
  legacy: PublishProvider | null | undefined,
  opts: { includeCurrent?: boolean; missing?: string[] } = {},
): { host: PublishProvider; projectId: string | null }[] {
  const out: { host: PublishProvider; projectId: string | null }[] = [];
  if (site.providerProjectId) out.push({ host: publisherFor(site, publisher, legacy), projectId: site.providerProjectId });
  if (site.legacyProjectId) {
    // With `missing`, an unconfigured old host is noted there instead of stopping the notice
    // from reaching the hosts that are configured (a takedown always reaches the live address).
    if (!legacy && opts.missing) opts.missing.push("legacy");
    else if (!legacy) throw new Error("no_host:legacy");
    else out.push({ host: legacy, projectId: site.legacyProjectId });
  }
  // The publish may have written to the new host before the record changed; a non-matching
  // saved ID lets that host adopt the slug's files (see CloudflarePublishProvider.publish).
  if (opts.includeCurrent && !out.some((t) => t.host === publisher)) {
    // A first publish has no saved ID yet; Cloudflare's and the server's derive from the slug.
    const id = site.providerProjectId ?? (publisher.name === "cloudflare" ? `cf:${site.slug}` : publisher.name === "server" ? `srv:${site.slug}` : null);
    if (id) out.push({ host: publisher, projectId: id });
  }
  return out;
}

/** What a site's old address shows (a fallback where the host can't redirect): both languages, no scripts. */
export function movedPage(url: string): string {
  const en = getMessages("en").safety;
  const am = getMessages("am").safety;
  const e = escapeHtml;
  const u = e(url);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${u}"><link rel="canonical" href="${u}"><title>${e(en.movedTitle)}</title>
<style>${NOTICE_STYLE}</style></head>
<body><main><section><h1>${e(en.movedTitle)}</h1><p>${e(en.movedBody)}</p><a href="${u}">${e(en.movedLink)}</a></section>
<section lang="am"><h2>${e(am.movedTitle)}</h2><p>${e(am.movedBody)}</p><a href="${u}">${e(am.movedLink)}</a></section></main></body></html>`;
}

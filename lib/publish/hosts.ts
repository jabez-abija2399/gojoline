import { getMessages } from "@/lib/i18n";
import type { PublishProvider } from "@/lib/providers/publish/types";
import { NOTICE_STYLE, escapeHtml } from "./notice";

/** The host a site currently lives on (the legacy one until it has moved). */
export function publisherFor(site: { provider: string }, publisher: PublishProvider, legacy?: PublishProvider | null): PublishProvider {
  return site.provider !== publisher.name && legacy?.name === site.provider ? legacy : publisher;
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

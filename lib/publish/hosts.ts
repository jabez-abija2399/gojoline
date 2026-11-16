import type { PublishProvider } from "@/lib/providers/publish/types";

/** The host a site currently lives on (the legacy one until it has moved). */
export function publisherFor(site: { provider: string }, publisher: PublishProvider, legacy?: PublishProvider | null): PublishProvider {
  return site.provider !== publisher.name && legacy?.name === site.provider ? legacy : publisher;
}

/** What a site's old address shows after it moved hosts: an immediate forward, no scripts. */
export function movedPage(url: string): string {
  const u = url.replace(/[<>"'&]/g, "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${u}"><link rel="canonical" href="${u}"><title>${u}</title></head><body><p><a href="${u}">${u}</a></p></body></html>`;
}

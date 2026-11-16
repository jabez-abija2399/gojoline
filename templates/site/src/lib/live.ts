/**
 * Locked: the published site's link to Gojoline at runtime. It reads the owner's quick details
 * (contact, hours, banner, resting) from the Data API and counts the visit, privately: no
 * cookies and no storage, except a flag that keeps the owner's own visits out of the count.
 */
import { publishMeta } from "./meta";
import type { Site, Text } from "./types";

export interface LiveInfo {
  offline?: boolean;
  business?: Partial<Site["business"]>;
  announcement?: Text[];
}

const api = () => (publishMeta.dataApiUrl && publishMeta.siteId && publishMeta.siteKey ? `${publishMeta.dataApiUrl}/api/public/sites/${publishMeta.siteId}` : null);

/** The owner's details over the built-in ones; anything they left empty keeps the site's own. */
export function mergeLive(site: Site, live: LiveInfo): Site {
  return { ...site, business: { ...site.business, ...live.business }, announcement: live.announcement ?? site.announcement };
}

/** Null when the API can't be reached: the site keeps its built-in details. */
export async function fetchLive(): Promise<LiveInfo | null> {
  const base = api();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/info?key=${encodeURIComponent(publishMeta.siteKey!)}`, { signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as LiveInfo) : null;
  } catch {
    return null;
  }
}

const OWNER = "gojo-owner";

/** Whether this page view should count (pure, for tests). */
export function shouldCount(e: { webdriver: boolean; host: string; owner: boolean; configured: boolean }): boolean {
  return e.configured && !e.webdriver && !e.owner && !/(^|\.)(vercel\.run|localhost|127\.0\.0\.1)$|^gojoline\./.test(e.host);
}

/** Sends one view after the page loads and is visible (never while prerendered or in a background tab). */
export function countVisit() {
  const base = api();
  let owner = false;
  try {
    // The dashboard's "Open" link adds #me: this browser is the owner's, so it isn't counted.
    if (location.hash === "#me") {
      localStorage.setItem(OWNER, "1");
      history.replaceState(history.state, "", location.pathname + location.search);
    }
    owner = localStorage.getItem(OWNER) === "1";
  } catch {
    // Storage blocked: count as a visitor.
  }
  const url = new URL(location.href);
  const src = url.searchParams.get("src") ?? undefined;
  const send = () => {
    if (document.visibilityState !== "visible") return void document.addEventListener("visibilitychange", send, { once: true });
    if (shouldCount({ webdriver: navigator.webdriver, host: location.hostname, owner, configured: Boolean(base) })) {
      const body = JSON.stringify({ path: url.pathname.slice(0, 120), ref: document.referrer.slice(0, 150), ...(src ? { src: src.slice(0, 20) } : {}), key: publishMeta.siteKey });
      navigator.sendBeacon?.(`${base}/visits`, new Blob([body], { type: "text/plain" }));
    }
    // A shared address stays clean: ?src=qr is only for counting.
    if (src) {
      url.searchParams.delete("src");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    }
  };
  if ((document as Document & { prerendering?: boolean }).prerendering) document.addEventListener("prerenderingchange", send, { once: true });
  else send();
}

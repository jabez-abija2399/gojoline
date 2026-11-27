"use client";

import { useEffect } from "react";
import { classifyClick } from "@/lib/analytics/clicks";

/**
 * Counts clicks on the links that matter for the admin's analytics (getting started, templates,
 * pricing, the guide, Telegram, sharing): one tiny beacon per click, only a link name and the
 * kind of page (lib/analytics/clicks.ts), never the address or who clicked. It also counts a visit
 * that came from one of Gojoline's own posts (the post's day and network only). Nothing else is sent.
 */
function send(data: string) {
  // sendBeacon survives the page navigating away; fetch keepalive is the fallback.
  if (!navigator.sendBeacon?.("/api/track", new Blob([data], { type: "application/json" }))) {
    void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: data, keepalive: true }).catch(() => undefined);
  }
}

/** A visit from one of Gojoline's own social posts (utm_campaign=post-YYYY-MM-DD): counted once per tab session. */
function countPostVisit() {
  const q = new URLSearchParams(location.search);
  const campaign = q.get("utm_campaign") ?? "";
  if (q.get("utm_medium") !== "social" || !/^post-\d{4}-\d{2}-\d{2}$/.test(campaign)) return;
  const source = (q.get("utm_source") ?? "other").slice(0, 20);
  try {
    const seen = `gojo-pv:${campaign}:${source}`;
    if (sessionStorage.getItem(seen)) return;
    sessionStorage.setItem(seen, "1");
  } catch {
    // No storage (private mode): the server's once-a-day limit per network still applies.
  }
  send(JSON.stringify({ v: campaign, s: source }));
}

export function ClickTracker() {
  useEffect(() => {
    countPostVisit();
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track], a[href]");
      if (!el) return;
      const hit = classifyClick({ track: el.dataset.track ?? null, href: el.getAttribute("href") }, location.pathname, location.origin);
      if (!hit) return;
      send(JSON.stringify({ n: hit.name, p: hit.page }));
    };
    // Capture: counted even when a link's own handler stops the event.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

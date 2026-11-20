"use client";

import { useEffect } from "react";
import { classifyClick } from "@/lib/analytics/clicks";

/**
 * Counts clicks on the links that matter for the admin's analytics (getting started, templates,
 * pricing, the guide, Telegram, sharing): one tiny beacon per click, only a link name and the
 * kind of page (lib/analytics/clicks.ts), never the address or who clicked. Nothing else is sent.
 */
export function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track], a[href]");
      if (!el) return;
      const hit = classifyClick({ track: el.dataset.track ?? null, href: el.getAttribute("href") }, location.pathname, location.origin);
      if (!hit) return;
      const data = JSON.stringify({ n: hit.name, p: hit.page });
      // sendBeacon survives the page navigating away; fetch keepalive is the fallback.
      if (!navigator.sendBeacon?.("/api/track", new Blob([data], { type: "application/json" }))) {
        void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: data, keepalive: true }).catch(() => undefined);
      }
    };
    // Capture: counted even when a link's own handler stops the event.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}

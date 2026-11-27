"use client";

import { createContext, useContext, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BILLING_TABS, type BillingTab } from "@/lib/billing/tabs";

const Ctx = createContext<{ tab: BillingTab; show: (t: BillingTab, focus?: string) => void } | null>(null);

/** Lets a part of the page (a plan card, the "Change" link) switch tabs. */
export function useBillingTabs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBillingTabs outside BillingTabs");
  return c;
}

/**
 * The Plan page's sections as tabs: one thing at a time on a phone. The open tab is kept in the
 * address (?tab=pay) so a reload, Back or a shared link opens the same one.
 */
export function BillingTabs({ initial, label, names, children }: { initial: BillingTab; label: string; names: Record<BillingTab, string>; children: ReactNode }) {
  const [tab, setTab] = useState<BillingTab>(initial);
  const listRef = useRef<HTMLDivElement>(null);

  const show = (next: BillingTab, focus?: string) => {
    setTab(next);
    const url = new URL(location.href);
    url.searchParams.set("tab", next);
    // A product only means something on the Pay tab; don't carry a stale one in a shared link.
    if (next !== "pay") url.searchParams.delete("product");
    url.hash = "";
    history.replaceState(null, "", url);
    // After React shows the panel: move focus (and the view) to what the person asked for.
    requestAnimationFrame(() => {
      const el = focus ? document.getElementById(focus) : null;
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      } else listRef.current?.scrollIntoView({ block: "nearest" });
    });
  };

  // Arrow keys move between tabs (the ARIA tabs pattern); Tab goes into the open panel.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = BILLING_TABS.indexOf(tab);
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? BILLING_TABS.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    const next = BILLING_TABS[(to + BILLING_TABS.length) % BILLING_TABS.length];
    show(next);
    document.getElementById(`billing-tab-${next}`)?.focus();
  };

  return (
    <Ctx.Provider value={{ tab, show }}>
      <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKey} className="chips-scroll sticky top-[57px] z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-line bg-paper px-4 sm:mx-0 sm:px-0 lg:top-0">
        {BILLING_TABS.map((x) => (
          <button
            key={x}
            id={`billing-tab-${x}`}
            type="button"
            role="tab"
            aria-selected={tab === x}
            aria-controls={`billing-panel-${x}`}
            tabIndex={tab === x ? 0 : -1}
            onClick={() => show(x)}
            className="relative min-h-12 shrink-0 px-3 text-sm font-medium whitespace-nowrap text-ink-muted transition-colors hover:text-ink aria-selected:font-semibold aria-selected:text-ink aria-selected:after:absolute aria-selected:after:inset-x-2 aria-selected:after:bottom-0 aria-selected:after:h-0.5 aria-selected:after:rounded-full aria-selected:after:bg-ink"
          >
            {names[x]}
          </button>
        ))}
      </div>
      {children}
    </Ctx.Provider>
  );
}

/** One tab's content; the others stay in the page, hidden. */
export function BillingPanel({ id, children }: { id: BillingTab; children: ReactNode }) {
  const { tab } = useBillingTabs();
  return (
    <div id={`billing-panel-${id}`} role="tabpanel" aria-labelledby={`billing-tab-${id}`} hidden={tab !== id} className="flex flex-col gap-8 pt-2">
      {children}
    </div>
  );
}

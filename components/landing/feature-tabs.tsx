"use client";

import { useState } from "react";
import type { FeatureItem, FeatureKey } from "./features";

/** The interactive part of the features section: a list of features and the picture for the one picked. */
export function FeatureTabs({ items, panels, backdrop }: { items: FeatureItem[]; panels: Record<FeatureKey, React.ReactNode>; backdrop: React.ReactNode }) {
  const [active, setActive] = useState<FeatureKey>(items[0]!.key);
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-12">
      <ul className="flex flex-col border-t border-line">
        {items.map((it) => {
          const on = it.key === active;
          return (
            <li key={it.key} className="border-b border-line">
              <button type="button" aria-expanded={on} onClick={() => setActive(it.key)} className="flex w-full flex-col gap-1 py-4 text-start">
                <span className={`flex items-center gap-3 text-xl font-semibold transition-colors ${on ? "text-ink" : "text-ink-muted hover:text-ink"}`}>
                  <span aria-hidden="true" className={`h-0.5 rounded-full bg-coral transition-all ${on ? "w-6" : "w-0"}`} />
                  {it.title}
                </span>
                {on && <span className="max-w-[46ch] ps-9 text-ink-muted">{it.body}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="relative isolate flex min-h-80 items-center justify-center overflow-hidden rounded-[1.75rem] bg-coral p-6 sm:p-10 lg:sticky lg:top-24 lg:self-start">
        {backdrop}
        <div key={active} className="relative flex w-full animate-[pop-in_0.3s_ease-out] justify-center">
          {panels[active]}
        </div>
      </div>
    </div>
  );
}

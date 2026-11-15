"use client";

import { useState } from "react";
import type { FeatureItem, FeatureKey } from "./features";

const stage = "relative isolate items-center justify-center overflow-hidden rounded-[1.75rem] bg-coral p-6";

/**
 * The interactive part of the features section: a list of features and the picture for the
 * one picked. On big screens the picture sits beside the list; on phones it opens right
 * under the feature that was tapped, so the result of the tap is always in view.
 */
export function FeatureTabs({ items, panels, backdrop }: { items: FeatureItem[]; panels: Record<FeatureKey, React.ReactNode>; backdrop: React.ReactNode }) {
  const [active, setActive] = useState<FeatureKey>(items[0]!.key);
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-12">
      <ul className="flex flex-col border-t border-line">
        {items.map((it) => {
          const on = it.key === active;
          return (
            <li key={it.key} className="border-b border-line">
              <h3>
                <button type="button" aria-expanded={on} aria-controls={`feature-${it.key}`} onClick={(e) => {
                    setActive(it.key);
                    // On phones the row above closes and this one moves: keep it in view.
                    const row = e.currentTarget.closest("li");
                    requestAnimationFrame(() => row?.scrollIntoView({ block: "nearest" }));
                  }} className={`flex min-h-14 w-full items-center gap-3 py-3 text-start text-xl font-semibold transition-colors ${on ? "text-ink" : "text-ink-muted hover:text-ink"}`}>
                  <span aria-hidden="true" className={`h-0.5 shrink-0 rounded-full bg-coral transition-all ${on ? "w-6" : "w-0"}`} />
                  {it.title}
                </button>
              </h3>
              {/* Every description is in the page's HTML; only the picked one is shown. */}
              <div id={`feature-${it.key}`} hidden={!on} className="flex flex-col gap-4 pb-5">
                <p className="max-w-[46ch] ps-9 text-ink-muted">{it.body}</p>
                <div className={`${stage} flex min-h-72 lg:hidden`}>
                  {backdrop}
                  <div className="relative flex w-full justify-center">{panels[it.key]}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className={`${stage} hidden min-h-[23.5rem] p-10 lg:sticky lg:top-24 lg:flex lg:self-start`}>
        {backdrop}
        <div key={active} className="relative flex w-full animate-[pop-in_0.3s_ease-out] justify-center">
          {panels[active]}
        </div>
      </div>
    </div>
  );
}

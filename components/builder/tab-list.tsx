"use client";

import { useRef } from "react";

interface Props<T extends string> {
  tabs: readonly T[];
  labels: Record<T, string>;
  active: T;
  onChange: (tab: T) => void;
  label: string;
  idPrefix: string;
  className?: string;
}

/** WAI-ARIA tabs: arrow keys, Home/End and roving tabindex. */
export function TabList<T extends string>({ tabs, labels, active, onChange, label, idPrefix, className = "" }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next]!);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={`gap-1 border-b border-line bg-white p-2 ${className}`}>
      {tabs.map((tab, i) => (
        <button
          key={tab}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-${tab}`}
          aria-selected={active === tab}
          aria-controls={`panel-${tab}`}
          tabIndex={active === tab ? 0 : -1}
          onClick={() => onChange(tab)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") move(i + 1);
            else if (e.key === "ArrowLeft") move(i - 1);
            else if (e.key === "Home") move(0);
            else if (e.key === "End") move(tabs.length - 1);
            else return;
            e.preventDefault();
          }}
          className="min-h-11 flex-1 rounded-lg px-2 text-sm font-medium text-ink-muted aria-selected:bg-teal aria-selected:text-white sm:flex-none sm:px-3 sm:text-base"
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}

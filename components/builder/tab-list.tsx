"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

interface Props<T extends string> {
  tabs: readonly T[];
  labels: Record<T, string>;
  active: T;
  onChange: (tab: T) => void;
  label: string;
  idPrefix: string;
  className?: string;
  icons?: Partial<Record<T, LucideIcon>>;
  /** A dot on tabs with something new to see; `badgeLabel` says so to screen readers. */
  badges?: Partial<Record<T, boolean>>;
  badgeLabel?: string;
}

/** WAI-ARIA tabs: arrow keys, Home/End and roving tabindex. */
export function TabList<T extends string>({ tabs, labels, active, onChange, label, idPrefix, className = "", icons, badges, badgeLabel }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next]!);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={`gap-1 ${className}`}>
      {tabs.map((tab, i) => {
        const Icon: LucideIcon | undefined = icons?.[tab];
        return (
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
          className="relative flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-sand aria-selected:bg-teal aria-selected:text-white sm:flex-none sm:px-3 sm:text-base"
        >
          {Icon && <Icon aria-hidden="true" className="hidden size-4 shrink-0 min-[520px]:block" />}
          {labels[tab]}
          {badges?.[tab] && (
            <>
              <span aria-hidden="true" className="absolute end-1.5 top-1.5 size-2.5 rounded-full bg-clay ring-2 ring-white" />
              <span className="sr-only">({badgeLabel})</span>
            </>
          )}
        </button>
        );
      })}
    </div>
  );
}

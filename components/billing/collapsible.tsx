"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * A section that folds away on phones (its title is a button there) and is always open on large
 * screens. The heading stays a heading for screen readers either way.
 */
export function Collapsible({ title, titleId, children, defaultOpen = false, count }: { title: string; titleId: string; children: ReactNode; defaultOpen?: boolean; count?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const body = useId();
  return (
    <section aria-labelledby={titleId} className="flex scroll-mt-6 flex-col gap-3">
      <h2 id={titleId} className="scroll-mt-6 text-lg font-semibold">
        <button type="button" aria-expanded={open} aria-controls={body} onClick={() => setOpen((o) => !o)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 text-start lg:hidden">
          <span>
            {title}
            {count && <span className="ms-2 text-sm font-medium text-ink-muted">{count}</span>}
          </span>
          <ChevronDown aria-hidden="true" className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <span className="max-lg:hidden">{title}</span>
      </h2>
      <div id={body} className={open ? "" : "max-lg:hidden"}>
        {children}
      </div>
    </section>
  );
}

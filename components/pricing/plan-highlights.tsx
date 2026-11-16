import { Check } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { planHighlights, type Highlight } from "@/lib/billing/compare";
import type { PlanId } from "@/lib/billing/plans";

export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);
/** Birr from integer santim, e.g. 499_000 → "4,990" (cents only when there are any). */
export const formatBirr = (minor: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(minor / 100);

export function highlightText(h: Highlight, t: Messages["plans"]["hl"]): string {
  return format(t[h.key], { n: "n" in h ? formatNumber(h.n) : "", size: "size" in h ? h.size : "" });
}

/** The plan's key features as a checked list, generated from PLAN_FEATURES. */
export function PlanHighlights({ plan, t, className = "" }: { plan: PlanId; t: Messages["plans"]["hl"]; className?: string }) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {planHighlights(plan).map((h) => (
        <li key={h.key} className="flex gap-2">
          <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink" strokeWidth={2.5} />
          <span>{highlightText(h, t)}</span>
        </li>
      ))}
    </ul>
  );
}

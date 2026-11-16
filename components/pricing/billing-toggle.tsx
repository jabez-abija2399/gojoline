import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";

export type BillingPeriod = "month" | "year";

export const periodFrom = (raw: unknown): BillingPeriod => (raw === "yearly" ? "year" : "month");

/**
 * Monthly / Yearly switch made of two links (`?billing=yearly`): works without JavaScript and
 * keeps the scroll position when JavaScript is there.
 */
export function BillingToggle({ t, period, basePath, monthsFree }: { t: Messages["plans"]; period: BillingPeriod; basePath: string; monthsFree: number }) {
  const opts = [
    { v: "month" as const, label: t.monthly, href: basePath },
    { v: "year" as const, label: t.yearly, href: `${basePath}?billing=yearly` },
  ];
  return (
    <nav aria-label={t.billingLabel} className="flex justify-center">
      <ul className="inline-flex gap-1 rounded-full border border-line bg-white p-1">
        {opts.map((o) => (
          <li key={o.v}>
            <Link
              href={o.href}
              scroll={false}
              replace
              aria-current={o.v === period ? "true" : undefined}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-semibold text-ink-muted hover:text-ink aria-[current=true]:bg-ink aria-[current=true]:text-white lg:min-h-9"
            >
              {o.label}
              {o.v === "year" && monthsFree > 0 && <span className="rounded-full bg-coral-soft px-2 py-0.5 text-sm font-semibold text-ink">{format(t.yearlyBadge, { months: monthsFree })}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

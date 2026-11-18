import Link from "next/link";
import { Gift, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import type { LedgerEntry } from "@/lib/billing/store";
import { Collapsible } from "./collapsible";

const ICONS = { monthly_grant: Plus, topup: Plus, ai_edit: Minus, refund: RotateCcw, admin: Gift, first_build: Sparkles } as const;
/** Text people typed may be in either language; screen readers need to know which. */
const langOf = (s: string) => (/[ሀ-፿]/.test(s) ? "am" : "en");

/** Every change added or used, newest first, a page at a time (plain links: works without JavaScript). */
export function CreditHistory({ t, locale, rows, page, hasOlder }: { t: Messages["billing"]; locale: Locale; rows: LedgerEntry[]; page: number; hasOlder: boolean }) {
  const when = new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const href = (p: number) => `/${locale}/billing?history=${p}#ledger-title`;
  return (
    // Folded on phones, except when the owner is paging through it.
    <Collapsible title={t.ledgerTitle} titleId="ledger-title" defaultOpen={page > 1}>
      <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <p className="text-ink-muted">{t.ledgerEmpty}</p>
      ) : (
        <ul aria-label={t.ledgerLabel} className="flex flex-col rounded-2xl border border-line bg-white">
          {rows.map((r, i) => {
            const Icon = ICONS[r.reason] ?? Plus;
            const title = r.reason === "ai_edit" && r.size ? format(t.ledgerAi, { size: t.sizeNames[r.size] }) : t.ledger[r.reason];
            return (
              <li key={`${r.createdAt.getTime()}-${i}`} className="flex items-start gap-3 border-t border-line p-3 first:border-0">
                <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-faint" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{title}</span>
                  {r.note && r.reason !== "admin" && (
                    <span lang={langOf(r.note)} className="truncate text-sm text-ink-muted">
                      {r.note}
                    </span>
                  )}
                  <span className="text-sm text-ink-muted tabular-nums">{when.format(r.createdAt)}</span>
                </div>
                {/* A signed number: the sign is text, so it is read out (no colour-only meaning). */}
                <span className="shrink-0 font-semibold tabular-nums">{r.delta > 0 ? `+${r.delta}` : r.delta < 0 ? `−${-r.delta}` : "0"}</span>
              </li>
            );
          })}
        </ul>
      )}
      {(page > 1 || hasOlder) && (
        <nav aria-label={t.ledgerPages} className="flex gap-2">
          {page > 1 && (
            <Link href={href(page - 1)} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:border-faint lg:min-h-9">
              {t.newer}
            </Link>
          )}
          {hasOlder && (
            <Link href={href(page + 1)} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:border-faint lg:min-h-9">
              {t.older}
            </Link>
          )}
        </nav>
      )}
      </div>
    </Collapsible>
  );
}

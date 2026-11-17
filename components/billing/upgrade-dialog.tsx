"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/dashboard/dialog";
import { OfferBadge, WasPrice } from "@/components/pricing/offer-price";
import type { PlanId } from "@/lib/billing/plans";
import type { UpgradeChoice } from "@/lib/billing/upgrade";
import { format } from "@/lib/i18n/format";
import type { Messages } from "@/lib/i18n";

/** Everything the dialog shows, worked out on the server from admin prices, plan features and the offer. */
export interface UpgradeInfo {
  plan: PlanId;
  /** Changes the owner's plan brings back each month, and when (Addis Ababa time). */
  monthly: number;
  nextGrant: string;
  /** Best first: the first is the coral button. */
  choices: (UpgradeChoice & { href: string })[];
  /** "Launch offer: 20% off until 31 Dec" when an offer lowers one of the prices. */
  offerText: string | null;
  /** localStorage key for "dismissed this month" (per user). */
  storageKey: string;
  /** This month, e.g. "2026-11" (Addis Ababa time). */
  month: string;
  planNames: Record<PlanId, string>;
}

const birr = (minor: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(minor / 100);

/** "You've used all your AI changes": when they come back, and what would help now. */
export function UpgradeDialog({ open, onClose, info, t }: { open: boolean; onClose: () => void; info: UpgradeInfo; t: Messages["upgrade"] }) {
  const first = info.choices[0];
  const free = info.plan === "free";
  const name = (c: UpgradeChoice) => (c.plan ? info.planNames[c.plan] : t.topupName);
  const primaryLabel = !first ? "" : first.plan ? format(t.upgradeTo, { plan: name(first) }) : format(t.buyMore, { n: first.changes });

  return (
    <Modal open={open} onClose={onClose} title={t.title} closeLabel={t.close} labelId="upgrade-title" wide>
      <p className="-mt-2 flex items-start gap-2 text-ink">
        <Sparkles aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink-muted" />
        {format(free ? t.backFree : t.backPaid, { n: info.monthly, date: info.nextGrant })}
      </p>
      <p className="text-ink-muted">{free ? t.leadFree : t.leadPaid}</p>
      {info.offerText && <OfferBadge text={info.offerText} />}
      <ul aria-label={t.choicesLabel} className={`grid gap-2 ${info.choices.length > 1 ? "grid-cols-2" : ""}`}>
        {info.choices.map((c, i) => (
          <li key={c.product} className={`flex min-w-0 flex-col gap-1 rounded-xl border p-3 ${i === 0 ? "border-ink ring-1 ring-ink" : "border-line"}`}>
            <h3 className="font-semibold">{name(c)}</h3>
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-display text-xl font-bold tabular-nums">{format(t.price, { price: birr(c.priceMinor) })}</span>
              {c.plan && <span className="text-sm text-ink-muted">{t.perMonth}</span>}
            </p>
            {c.wasMinor !== null && <WasPrice price={format(t.price, { price: birr(c.wasMinor) })} was={t.was} className="text-sm" />}
            <p className="text-sm text-ink-muted">{format(c.plan ? t.changesMonth : t.changesPack, { n: c.changes })}</p>
            {i > 0 && (
              <Link href={c.href} onClick={onClose} className="mt-auto inline-flex min-h-11 items-center pt-1 text-sm font-semibold text-ink underline underline-offset-4 lg:min-h-9">
                {format(t.choose, { plan: name(c) })}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:border-faint hover:bg-sunken">
          {t.later}
        </button>
        {first && (
          <Link href={first.href} onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-coral px-4 text-sm font-semibold text-on-coral hover:bg-coral-hover">
            {primaryLabel}
          </Link>
        )}
      </div>
    </Modal>
  );
}

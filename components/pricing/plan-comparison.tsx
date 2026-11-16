import { Check, Minus } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { planComparison, type Cell } from "@/lib/billing/compare";
import { PLAN_IDS, type PlanId } from "@/lib/billing/plans";

const num = (n: number) => new Intl.NumberFormat("en-US").format(n);

function CellView({ cell, t }: { cell: Cell; t: Messages["plans"]["compare"] }) {
  switch (cell.kind) {
    case "yes":
      return (
        <>
          <Check aria-hidden="true" className="mx-auto size-5 text-ink" strokeWidth={2.5} />
          <span className="sr-only">{t.yes}</span>
        </>
      );
    case "no":
      return (
        <>
          <Minus aria-hidden="true" className="mx-auto size-5 text-ink-muted" />
          <span className="sr-only">{t.no}</span>
        </>
      );
    case "number":
      return <>{num(cell.n)}</>;
    case "upTo":
      return <>{format(t.upTo, { n: num(cell.n) })}</>;
    case "months":
      return <>{format(t.months, { n: cell.n })}</>;
    case "size":
      return <>{cell.text}</>;
    case "domainHelp":
      return <>{t.domainHelp[cell.value]}</>;
    case "support":
      return <>{t.support[cell.value]}</>;
  }
}

/**
 * The full feature table, generated from PLAN_FEATURES. Used on the pricing page and in
 * Admin → Settings, so everyone sees the same thing. All three plans fit at 360 px (narrow
 * feature column, small cells); on anything narrower it scrolls inside its own focusable box.
 */
export function PlanComparison({ t, planNames, headingLevel = 2, id = "compare" }: { t: Messages["plans"]["compare"]; planNames: Record<PlanId, string>; headingLevel?: 2 | 3; id?: string }) {
  const rows = planComparison();
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-3">
      <H id={`${id}-title`} className={headingLevel === 2 ? "text-2xl font-semibold tracking-tight sm:text-3xl" : "text-lg font-semibold"}>{t.title}</H>
      <div role="region" aria-labelledby={`${id}-title`} tabIndex={0} className="relative max-w-full overflow-x-auto rounded-2xl border border-line bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        <table className="w-full min-w-[20rem] table-fixed border-collapse text-start text-sm sm:text-base">
          <caption className="sr-only">{t.caption}</caption>
          <colgroup>
            <col className="w-[8.5rem] sm:w-2/5" />
            {PLAN_IDS.map((p) => <col key={p} />)}
          </colgroup>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="sticky start-0 z-[1] bg-white px-3 py-3 text-start font-medium text-ink-muted sm:px-4">{t.feature}</th>
              {PLAN_IDS.map((p) => (
                <th key={p} scope="col" className="px-1.5 py-3 text-center font-semibold [overflow-wrap:anywhere] sm:px-3">
                  {planNames[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, cells }) => (
              <tr key={row} className="border-b border-line last:border-0">
                <th scope="row" className="sticky start-0 z-[1] bg-white px-3 py-3 text-start text-base font-normal sm:px-4">{t.rows[row]}</th>
                {PLAN_IDS.map((p) => (
                  <td key={p} className="px-1.5 py-3 text-center tabular-nums [overflow-wrap:anywhere] sm:px-3">
                    <CellView cell={cells[p]} t={t} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

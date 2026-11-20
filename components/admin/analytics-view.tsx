import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { BarChart } from "@/components/admin/bar-chart";
import type { AnalyticsReport, Metric } from "@/lib/analytics/report";
import { change, PERIODS } from "@/lib/analytics/periods";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type T = Messages["admin"]["analytics"];

/** The order the admin reads them: growth, building, reach, money. */
const CARDS: Metric[] = ["signups", "sitesStarted", "aiChanges", "published", "republished", "visits", "leads", "clicks", "payments", "revenue", "aiCost", "feedback"];
/** Charts for the measures that tell the story over time. */
const CHARTS: Metric[] = ["signups", "sitesStarted", "published", "clicks", "visits", "revenue"];

/** Measures where a rise is bad news (shown without the good-news colour). */
const LOWER_IS_BETTER: Metric[] = ["aiCost"];

/**
 * Admin → Analytics: day, week or month (Addis Ababa time). Cards compare the current period with
 * the one before; charts show the last 14 days, 12 weeks or 12 months; then the sign-up funnel,
 * which links were clicked (and on which pages), templates started from and where owners came from.
 */
export function AnalyticsView({ r, t, locale, templateName, sourceName, birr, usd }: { r: AnalyticsReport; t: T; locale: Locale; templateName: (id: string | null) => string; sourceName: (s: string) => string; birr: (minor: number) => string; usd: (nano: number) => string }) {
  const tag = locale === "am" ? "am-ET" : "en-GB";
  const num = (v: number) => v.toLocaleString(tag);
  const value = (m: Metric, v: number) => (m === "revenue" ? birr(v) : m === "aiCost" ? usd(v) : num(v));
  // Gregorian dates in both languages (the app's dates are Gregorian), with full month names in Amharic.
  const month = locale === "am" ? "long" : "short";
  const dayFmt = new Intl.DateTimeFormat(tag, r.period === "month" ? { month, year: "numeric", timeZone: "UTC" } : { day: "numeric", month, timeZone: "UTC" });
  const label = (day: string) => (r.period === "week" ? format(t.weekOf, { date: dayFmt.format(new Date(`${day}T00:00:00Z`)) }) : dayFmt.format(new Date(`${day}T00:00:00Z`)));
  const now = r.buckets.length - 1;
  const f = r.funnel;
  const pct = (n: number) => (f.signedUp ? Math.round((n / f.signedUp) * 100) : 0);
  const clicksTotal = r.clicks.reduce((n, c) => n + c.total, 0);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label={t.periodLabel} className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/${locale}/admin?tab=analytics&period=${p}`}
            aria-current={p === r.period ? "page" : undefined}
            className="inline-flex min-h-11 pointer-fine:min-h-9 items-center rounded-full border border-line bg-white px-4 font-medium text-ink hover:border-faint aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white"
          >
            {t.periods[p]}
          </Link>
        ))}
        <span className="text-sm text-ink-muted">{format(t.since, { date: label(r.buckets[now]!) })}</span>
      </nav>
      <p className="max-w-[70ch] text-xs text-ink-muted">{t.intro}</p>

      <section aria-labelledby="an-cards" className="flex flex-col gap-2">
        <h2 id="an-cards" className="text-base font-semibold">{t.current[r.period]}</h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CARDS.map((m) => {
            const s = r.series[m];
            const cur = s[now]!.value;
            const prev = s[now - 1]?.value ?? 0;
            const d = change(cur, prev);
            const good = LOWER_IS_BETTER.includes(m) ? (d ?? 0) < 0 : (d ?? 0) > 0;
            const bad = d !== null && d !== 0 && !good;
            const tone = good ? "text-lagoon" : bad ? "text-danger" : "";
            return (
              <li key={m} className="flex flex-col gap-1 rounded-xl border border-line bg-white p-3">
                <span className="text-sm text-ink-muted">{t.metrics[m]}</span>
                <span className="font-display text-2xl font-bold tabular-nums">{value(m, cur)}</span>
                <span className="flex items-center gap-1 text-xs text-ink-muted tabular-nums">
                  {d !== null && d > 0 && <TrendingUp aria-hidden="true" className={`size-3.5 ${tone}`} />}
                  {d !== null && d < 0 && <TrendingDown aria-hidden="true" className={`size-3.5 ${tone}`} />}
                  {format(t.previous[r.period], { value: value(m, prev) })}
                  {d !== null && ` · ${d > 0 ? "+" : ""}${d}%`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section aria-labelledby="an-funnel" className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <h2 id="an-funnel" className="text-base font-semibold">{t.funnelTitle}</h2>
          <p className="text-xs text-ink-muted">{t.funnelIntro[r.period]}</p>
          <ol className="flex flex-col gap-2">
            {(["signedUp", "started", "published", "paid"] as const).map((k) => (
              <li key={k} className="flex flex-col gap-1">
                <span className="flex justify-between gap-2 text-sm">
                  <span>{t.funnel[k]}</span>
                  <span className="font-semibold tabular-nums">
                    {num(f[k])}
                    {k !== "signedUp" && f.signedUp > 0 && <span className="font-normal text-ink-muted"> · {pct(f[k])}%</span>}
                  </span>
                </span>
                <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-sunken">
                  <span className="block h-full rounded-full bg-ink" style={{ width: `${k === "signedUp" ? (f.signedUp ? 100 : 0) : pct(f[k])}%` }} />
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="an-clicks" className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <h2 id="an-clicks" className="text-base font-semibold">{format(t.clicksTitle, { n: num(clicksTotal) })}</h2>
          <p className="text-xs text-ink-muted">{t.clicksIntro}</p>
          {r.clicks.length === 0 ? (
            <p className="text-ink-muted">{t.noData}</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-xs text-ink-muted">
                  <th scope="col" className="py-1 text-start font-medium">{t.link}</th>
                  <th scope="col" className="py-1 text-start font-medium">{t.fromPages}</th>
                  <th scope="col" className="w-14 py-1 text-end font-medium">{t.clicks}</th>
                </tr>
              </thead>
              <tbody>
                {r.clicks.map((c) => (
                  <tr key={c.name} className="border-t border-line align-top">
                    <th scope="row" className="py-2 pe-2 text-start font-medium">{t.links[c.name]}</th>
                    <td className="py-2 pe-2 text-xs text-ink-muted">{c.pages.map((p) => `${t.pages[p.page]} ${num(p.n)}`).join(" · ")}</td>
                    <td className="py-2 text-end font-semibold tabular-nums">{num(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section aria-labelledby="an-templates" className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <h2 id="an-templates" className="text-base font-semibold">{t.templatesTitle}</h2>
          {r.templates.length === 0 ? (
            <p className="text-ink-muted">{t.noData}</p>
          ) : (
            <ul className="flex flex-col">
              {r.templates.map((x) => (
                <li key={x.id ?? "chat"} className="flex justify-between gap-2 border-t border-line py-2 text-sm first:border-0">
                  <span>{templateName(x.id)}</span>
                  <span className="font-semibold tabular-nums">{num(x.n)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="an-sources" className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
          <h2 id="an-sources" className="text-base font-semibold">{t.sourcesTitle}</h2>
          {r.sources.length === 0 ? (
            <p className="text-ink-muted">{t.noData}</p>
          ) : (
            <ul className="flex flex-col">
              {r.sources.map((x) => (
                <li key={x.source} className="flex justify-between gap-2 border-t border-line py-2 text-sm first:border-0">
                  <span>{sourceName(x.source)}</span>
                  <span className="font-semibold tabular-nums">{num(x.n)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="an-trend" className="flex flex-col gap-2">
        <h2 id="an-trend" className="text-base font-semibold">{t.trendTitle[r.period]}</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {CHARTS.map((m) => (
            <BarChart key={m} compact title={t.metrics[m]} data={r.series[m]} format={(v) => value(m, v)} totalText={(v) => format(t.total, { value: v })} formatDay={label} tableLabel={t.showTable} dayLabel={t.periodCol[r.period]} valueLabel={t.value} emptyLabel={t.noDataTrend} />
          ))}
        </div>
      </section>
    </div>
  );
}

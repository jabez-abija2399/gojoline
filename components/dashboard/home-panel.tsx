import Link from "next/link";
import { ArrowRight, Check, Lock, Moon, Send, TriangleAlert, Users, Inbox, MessageCircle, Info } from "lucide-react";
import { ago } from "@/lib/app/shell-data";
import { nextStep, weekTrend, type Trend } from "@/lib/dashboard/stats";
import type { Home } from "@/lib/dashboard/overview";
import { DEVICES, SOURCES } from "@/lib/visits/classify";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { Address } from "./address";
import { Bars } from "./bars";
import { DayColumns } from "./day-columns";
import { LiveActions } from "./live-actions";

type T = Messages["dashboard"];
const card = "rounded-2xl border border-line bg-white";
const secondary = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:border-faint hover:bg-sunken lg:min-h-9";

function trendWords(t: T, trend: Trend): string {
  switch (trend.kind) {
    case "up":
      return format(t.trendUp, { n: trend.n });
    case "down":
      return format(t.trendDown, { n: trend.n });
    case "first":
      return t.trendFirst;
    case "new":
      return t.trendNew;
    case "none":
      return t.trendNone;
    default:
      return t.trendSame;
  }
}

/** Home: is the site out there, the one next step, and three numbers for the last week. */
export function HomePanel({ o, t, locale, projectId, siteName, supportBot, scan }: { o: Home; t: T; locale: Locale; projectId: string; siteName: string; supportBot: string; scan: string[] }) {
  const builder = `/${locale}/build/${projectId}`;
  const tab = (id: string, hash = "") => `/${locale}/dashboard/${projectId}?tab=${id}${hash}`;
  const num = new Intl.NumberFormat(locale === "am" ? "am-ET" : "en-US");
  const dayFmt = new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const formatDay = (day: string) => dayFmt.format(new Date(`${day}T00:00:00Z`));
  const dayNum = new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { day: "numeric", timeZone: "UTC" });
  const done = o.steps.filter((s) => s.done).length;
  const next = nextStep(o.steps);
  const stepHref = (id: string) => (id === "info" ? tab("info") : id === "photos" ? tab("content", "#photos") : id === "telegram" ? tab("settings", "#telegram") : id === "domain" ? (o.canOwnDomain ? tab("settings", "#address") : `/${locale}/billing`) : builder);
  const visitsTotal = o.visits.perDay.reduce((n, d) => n + d.value, 0);
  const people = { visitors: weekTrend({ thisWeek: o.visits.thisWeek, lastWeek: o.visits.lastWeek, total: visitsTotal }), messages: weekTrend(o.messages) };
  const live = o.address && o.status !== "taken_down";
  const draft = o.status === "draft";

  const steps = (
    <ol className="flex flex-col">
      {o.steps.map((s) => (
        <li key={s.id}>
          <Link href={stepHref(s.id)} className="group flex min-h-11 items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sunken">
            <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{s.done && <Check className="size-3.5" />}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`text-sm font-medium ${s.done ? "text-ink-muted line-through decoration-faint" : "text-ink"}`}>
                {t.steps[s.id].title}
                {s.done && <span className="sr-only"> ({t.setupDone})</span>}
              </span>
              {!s.done && <span className="text-sm text-ink-muted">{s.id === "domain" && o.canOwnDomain ? t.domainHintPaid : t.steps[s.id].hint}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Is the site out in the world? Draft sites lead with publishing (the page's coral). */}
      <section aria-labelledby="dash-site-state" className={`${card} flex flex-col gap-4 p-5 sm:p-6`}>
        <div className="flex flex-col gap-1">
          <h2 id="dash-site-state" className="flex items-center gap-2 text-lg font-semibold">
            {o.status === "live" ? (
              <span aria-hidden="true" className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-[ping_1.2s_cubic-bezier(0,0,0.2,1)_3] rounded-full bg-lagoon opacity-60 motion-reduce:hidden" /><span className="relative inline-flex size-2.5 rounded-full bg-lagoon" /></span>
            ) : o.status === "taken_down" ? (
              <TriangleAlert aria-hidden="true" className="size-5 text-danger" />
            ) : o.status === "resting" ? (
              <Moon aria-hidden="true" className="size-5 text-warning" />
            ) : (
              <Lock aria-hidden="true" className="size-4 text-ink-muted" />
            )}
            {{ live: t.liveTitle, resting: t.restingTitle, draft: t.draftTitle, taken_down: t.takenDownTitle }[o.status]}
          </h2>
          <p className="max-w-[60ch] text-ink-muted">{{ live: t.liveBody, resting: t.restingBody, draft: t.draftBody, taken_down: t.takenDownBody }[o.status]}</p>
        </div>
        {live && o.address && (
          <>
            <p className="rounded-xl bg-sunken px-3 py-2.5 font-medium text-ink"><Address text={o.address.text} /></p>
            <LiveActions t={t} href={o.address.href} text={o.address.text} siteName={siteName} scan={scan} />
            {o.status === "resting" && (
              <Link href={tab("settings", "#offline")} className={`${secondary} w-fit`}>
                {t.restingCta}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            )}
            {o.outdated && (
              <p className="flex items-start gap-2 text-sm text-ink-muted">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  {t.runtimeNote}{" "}
                  <Link href={builder} className="font-medium text-link underline underline-offset-4">{t.publishNow}</Link>
                </span>
              </p>
            )}
          </>
        )}
        {draft && (
          <Link href={builder} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-lg bg-coral px-5 font-semibold text-on-coral transition-colors hover:bg-coral-hover">
            {t.draftCta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
        {o.status === "taken_down" && (
          <a href={`https://t.me/${supportBot}`} target="_blank" rel="noopener noreferrer" className={`${secondary} w-fit`}>
            <Send aria-hidden="true" className="size-4" />
            {t.writeToUs}
            <span className="sr-only">{t.newTab}</span>
          </a>
        )}
      </section>

      {/* One next step; the whole list waits behind a disclosure. Drafts see the list (publishing leads above). */}
      {draft ? (
        <section aria-labelledby="dash-steps-title" className={`${card} flex flex-col gap-2 p-5`}>
          <h2 id="dash-steps-title" className="text-base font-semibold">{format(t.allSteps, { done, total: o.steps.length })}</h2>
          {steps}
        </section>
      ) : (
        <section aria-labelledby="dash-next-title" className={`${card} flex flex-col gap-3 p-5`}>
          <h2 id="dash-next-title" className="text-sm font-semibold text-ink-muted">{t.nextTitle}</h2>
          {next ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-lg font-semibold">{t.steps[next.id].title}</p>
                <p className="text-ink-muted">{next.id === "domain" && o.canOwnDomain ? t.domainHintPaid : t.steps[next.id].hint}</p>
              </div>
              <Link href={stepHref(next.id)} className={`${secondary} w-fit shrink-0`}>
                {t.stepGo}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ) : (
            <p className="flex items-center gap-2 font-medium"><Check aria-hidden="true" className="size-5 text-lagoon" />{t.allDone}</p>
          )}
          <details className="group">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-ink underline underline-offset-4">{format(t.allSteps, { done, total: o.steps.length })}</summary>
            {steps}
          </details>
        </section>
      )}

      {!draft && (
        <>
          {/* Three numbers for the last 7 days, each with the week before in words. */}
          <section aria-labelledby="dash-kpi-title" className="flex flex-col gap-2">
            <h2 id="dash-kpi-title" className="text-sm font-semibold text-ink-muted">{t.kpiTitle}</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              <Kpi icon={Users} label={t.kpiVisitors} value={o.visits.thisWeek > 0 ? format(t.kpiAbout, { n: num.format(o.visits.thisWeek) }) : num.format(0)} hint={trendWords(t, people.visitors)} />
              <Kpi icon={MessageCircle} label={t.kpiMessages} value={num.format(o.messages.thisWeek)} hint={trendWords(t, people.messages)} />
              <Kpi icon={Inbox} label={t.kpiWaiting} value={num.format(o.messages.waiting)} hint={o.messages.waiting > 0 ? t.kpiWaitingHint : t.kpiWaitingNone} href={o.messages.waiting > 0 ? tab("messages") : undefined} attention={o.messages.waiting > 0} />
            </ul>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section aria-labelledby="dash-visits-title" className={`${card} flex flex-col gap-3 p-5`}>
              <div className="flex flex-col gap-0.5">
                <h2 id="dash-visits-title" className="text-base font-semibold">{t.chartVisitors}</h2>
                <p className="text-sm text-ink-muted">{t.privacyNote}</p>
              </div>
              {o.visits.any ? (
                <DayColumns days={o.visits.perDay} label={t.chartVisitors} dayLabel={(d) => dayNum.format(new Date(`${d}T00:00:00Z`))} fullDay={formatDay} format={(n) => num.format(n)} />
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-ink-muted">{t.visitorsEmpty}</p>
                  {live && o.address && <LiveActions t={t} href={o.address.href} text={o.address.text} siteName={siteName} scan={scan} only="qr" />}
                </div>
              )}
            </section>

            <div className="flex flex-col gap-4">
              {o.visits.any && <Sources o={o} t={t} num={num} />}
              <section aria-labelledby="dash-recent-title" className={`${card} flex flex-col gap-2 p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 id="dash-recent-title" className="text-base font-semibold">{t.recentTitle}</h2>
                  {o.recent.length > 0 && (
                    <Link href={tab("messages")} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline lg:min-h-9">
                      {t.seeAll}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  )}
                </div>
                {o.recent.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line p-4 text-ink-muted">{t.messagesEmpty}</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-line">
                    {o.recent.map((a) => (
                      <li key={a.id}>
                        <Link href={tab("messages")} className="-mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 py-3 hover:bg-sunken">
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                              {a.heading}
                              {a.status === "new" && <span className="rounded-full bg-coral-soft px-1.5 text-xs font-semibold text-ink">{t.status.new}</span>}
                              <span className="text-xs font-normal text-ink-muted">{ago(a.createdAt, locale)}</span>
                            </span>
                            <span className="truncate text-ink-muted sm:text-sm">{a.preview}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, href, attention }: { icon: typeof Users; label: string; value: string; hint: string; href?: string; attention?: boolean }) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink-muted">
        {label}
        <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${attention ? "bg-coral-soft text-ink" : "border border-line bg-paper text-ink"}`}>
          <Icon className="size-4" />
        </span>
      </span>
      <span className="font-display text-3xl font-semibold tracking-tight tabular-nums text-ink">{value}</span>
      <span className={`text-sm ${attention ? "font-medium text-ink" : "text-ink-muted"}`}>{hint}</span>
    </>
  );
  return (
    <li className={`${card} ${attention ? "border-coral" : ""}`}>
      {href ? <Link href={href} className="flex h-full flex-col gap-1 rounded-2xl p-4 hover:bg-sunken">{body}</Link> : <div className="flex flex-col gap-1 p-4">{body}</div>}
    </li>
  );
}

function Sources({ o, t, num }: { o: Home; t: T; num: Intl.NumberFormat }) {
  const sources = SOURCES.map((s) => ({ key: s, label: t.sources[s], value: o.visits.sources[s] ?? 0 })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  const total = sources.reduce((n, r) => n + r.value, 0);
  const devices = DEVICES.map((d) => ({ key: d, label: t.devices[d], value: o.visits.devices[d] ?? 0 }));
  const deviceTotal = devices.reduce((n, r) => n + r.value, 0);
  const pct = (v: number, all: number) => format(t.percent, { n: Math.round((v / Math.max(1, all)) * 100) });
  return (
    <section aria-labelledby="dash-sources-title" className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex flex-col gap-2">
        <h2 id="dash-sources-title" className="text-base font-semibold">{t.sourcesTitle}</h2>
        {total > 0 ? <Bars label={t.sourcesTitle} rows={sources.map((r) => ({ ...r, text: pct(r.value, total), srText: format(t.people, { n: num.format(r.value) }) }))} /> : <p className="text-ink-muted">{t.trendNone}</p>}
      </div>
      {deviceTotal > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t.devicesTitle}</h3>
          <Bars label={t.devicesTitle} max={deviceTotal} rows={devices.map((r) => ({ ...r, text: pct(r.value, deviceTotal) }))} />
        </div>
      )}
    </section>
  );
}

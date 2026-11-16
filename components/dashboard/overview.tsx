import Link from "next/link";
import { ArrowRight, ArrowDownRight, ArrowUpRight, Check, Clock, ExternalLink, Globe, Inbox, Lock, MessageCircle, Minus, Send, Sparkles, TriangleAlert } from "lucide-react";
import { BarChart } from "@/components/admin/bar-chart";
import { ago } from "@/lib/app/shell-data";
import { weekTrend } from "@/lib/dashboard/stats";
import type { Overview } from "@/lib/dashboard/overview";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { CopyLink } from "./copy-link";

const card = "rounded-2xl border border-line bg-white";
const secondary = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:border-faint hover:bg-sunken lg:min-h-9";

/** The first screen of a site's dashboard: is it live, what came in, what to do next. */
export function OverviewPanel({ o, t, locale, projectId, siteName, supportBot }: { o: Overview; t: Messages["dashboard"]; locale: Locale; projectId: string; siteName: string; /** The Telegram bot owners can write to. */ supportBot: string }) {
  const builder = `/${locale}/build/${projectId}`;
  const tab = (id: string) => `/${locale}/dashboard/${projectId}?tab=${id}`;
  const num = new Intl.NumberFormat(locale === "am" ? "am-ET" : "en-US");
  const trend = weekTrend(o.stats);
  const done = o.steps.filter((s) => s.done).length;
  const shareText = encodeURIComponent(siteName);
  const shareUrl = o.address ? encodeURIComponent(o.address.href) : "";

  const rising = trend.kind === "up" || trend.kind === "first" || trend.kind === "new";
  const TrendIcon = rising ? ArrowUpRight : trend.kind === "down" ? ArrowDownRight : Minus;
  const trendText = { up: () => format(t.trendUp, { n: (trend as { n: number }).n }), down: () => format(t.trendDown, { n: (trend as { n: number }).n }), first: () => t.trendFirst, new: () => t.trendNew, none: () => t.trendNone, same: () => t.trendSame }[trend.kind]();
  // "15 Nov" in the owner's language; the day keys are already Addis Ababa days.
  const dayFmt = new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const formatDay = (day: string) => dayFmt.format(new Date(`${day}T00:00:00Z`));

  const kpis = [
    { id: "unread", icon: Inbox, label: t.kpiUnread, value: num.format(o.stats.unread), hint: t.kpiUnreadHint, accent: o.stats.unread > 0 },
    { id: "week", icon: TrendIcon, label: t.kpiWeek, value: num.format(o.stats.thisWeek), hint: trendText, tone: rising ? "text-lagoon" : trend.kind === "down" ? "text-warning" : "text-ink-muted" },
    { id: "total", icon: MessageCircle, label: t.kpiTotal, value: num.format(o.stats.total), hint: t.kpiTotalHint },
    { id: "changed", icon: Clock, label: t.kpiChanged, value: o.lastChange ? ago(o.lastChange, locale) : t.kpiNever, hint: o.versions === 1 ? t.kpiChangedHintOne : format(t.kpiChangedHint, { n: o.versions }), small: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Is the site out in the world, and the quickest ways to share it. */}
      <section aria-labelledby="site-state" className={`${card} relative overflow-hidden p-5 sm:p-6`}>
        <span aria-hidden="true" className={`pointer-events-none absolute -end-20 -top-24 size-64 rounded-full blur-3xl ${o.status === "live" ? "bg-lagoon/15" : o.status === "taken_down" ? "bg-danger/15" : "bg-coral-soft"}`} />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="site-state" className="flex items-center gap-2 text-lg font-semibold">
              {o.status === "live" ? <span aria-hidden="true" className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-lagoon opacity-60 motion-reduce:hidden" /><span className="relative inline-flex size-2.5 rounded-full bg-lagoon" /></span> : o.status === "taken_down" ? <TriangleAlert aria-hidden="true" className="size-5 text-danger" /> : <Lock aria-hidden="true" className="size-4 text-ink-muted" />}
              {o.status === "live" ? t.liveTitle : o.status === "taken_down" ? t.takenDownTitle : t.draftTitle}
            </h2>
            <p className="max-w-[60ch] text-ink-muted">{o.status === "live" ? t.liveBody : o.status === "taken_down" ? t.takenDownBody : t.draftBody}</p>
          </div>
          {o.address ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <a href={o.address.href} target="_blank" rel="noopener noreferrer" className="flex min-h-11 min-w-0 max-w-full basis-full items-center gap-2 rounded-xl bg-sunken px-3 py-2 font-medium text-ink hover:underline sm:basis-auto lg:min-h-10">
                  <Globe aria-hidden="true" className="size-4 shrink-0 text-lagoon" />
                  <span className="break-all sm:truncate sm:break-normal">{o.address.text}</span>
                  <span className="sr-only">{t.newTab}</span>
                </a>
                <CopyLink url={o.address.href} label={t.copyLink} done={t.copied} />
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={o.address.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ink px-3 text-sm font-medium text-white transition-colors hover:bg-ink-hover lg:min-h-9">
                  <ExternalLink aria-hidden="true" className="size-4" />
                  {t.visitSite}
                  <span className="sr-only">{t.newTab}</span>
                </a>
                <a href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                  <Send aria-hidden="true" className="size-4" />
                  {t.shareTelegram}
                  <span className="sr-only">{t.newTab}</span>
                </a>
                <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                  <MessageCircle aria-hidden="true" className="size-4" />
                  {t.shareWhatsApp}
                  <span className="sr-only">{t.newTab}</span>
                </a>
              </div>
            </>
          ) : o.status === "draft" ? (
            // Publishing is the one thing to do here, so it takes the page's coral.
            <Link href={builder} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-coral px-4 text-sm font-medium text-on-coral transition-colors hover:bg-coral-hover lg:min-h-9">
              {t.draftCta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <a href={`https://t.me/${supportBot}`} target="_blank" rel="noopener noreferrer" className={secondary + " w-fit"}>
              <Send aria-hidden="true" className="size-4" />
              {t.writeToUs}
              <span className="sr-only">{t.newTab}</span>
            </a>
          )}
        </div>
      </section>

      {/* Four numbers, each answering one question. */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.id} className={`${card} flex flex-col gap-1.5 p-4`}>
            <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink-muted">
              {k.label}
              <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${k.accent ? "border-transparent bg-coral-soft text-link" : "border-line bg-paper text-ink"}`}>
                <k.icon className="size-4" />
              </span>
            </span>
            <span className={`font-display font-semibold tracking-tight tabular-nums text-ink ${k.small ? "text-xl" : "text-3xl"}`}>{k.value}</span>
            <span className={`text-xs ${k.tone ?? "text-ink-muted"}`}>{k.hint}</span>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarChart title={t.chartTitle} data={o.stats.perDay} format={(v) => num.format(v)} tableLabel={t.chartTable} dayLabel={t.chartDay} valueLabel={t.chartValue} emptyLabel={t.chartEmpty} formatDay={formatDay} heading />
        </div>

        {/* What's left to make the site complete, with a ring that fills as it gets done. */}
        <section aria-labelledby="setup-title" className={`${card} flex flex-col gap-3 p-5`}>
          <div className="flex items-center gap-3">
            <ProgressRing done={done} total={o.steps.length} />
            <div className="min-w-0">
              <h2 id="setup-title" className="text-base font-semibold">{t.setupTitle}</h2>
              <p className="text-sm text-ink-muted">{format(t.setupProgress, { done, total: o.steps.length })}</p>
            </div>
          </div>
          <ol className="flex flex-col">
            {o.steps.map((s) => {
              const href = s.id === "photos" ? tab("photos") : s.id === "telegram" ? tab("telegram") : s.id === "domain" && !o.canOwnDomain ? `/${locale}/billing` : builder;
              return (
                <li key={s.id}>
                  <Link href={href} className="group flex min-h-11 items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sunken">
                    <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-lagoon bg-lagoon text-white" : "border-line bg-white"}`}>
                      {s.done && <Check className="size-3.5" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`text-sm font-medium ${s.done ? "text-ink-muted line-through decoration-faint" : "text-ink"}`}>
                        {t.steps[s.id].title}
                        {s.done && <span className="sr-only"> ({t.setupDone})</span>}
                      </span>
                      {!s.done && <span className="text-sm text-ink-muted">{s.id === "domain" && o.canOwnDomain ? t.domainHintPaid : t.steps[s.id].hint}</span>}
                    </span>
                    {!s.done && <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section aria-labelledby="recent-answers" className={`${card} flex flex-col gap-2 p-5`}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-answers" className="text-base font-semibold">{t.recentTitle}</h2>
          {o.recent.length > 0 && (
            <Link href={tab("answers")} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline lg:min-h-9">
              {t.seeAll}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </div>
        {o.recent.length === 0 ? (
          <p className="flex items-center gap-3 rounded-xl border border-dashed border-line p-5 text-ink-muted">
            <Sparkles aria-hidden="true" className="size-5 shrink-0 text-faint" />
            {t.answersEmpty}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {o.recent.map((a) => (
              <li key={a.id}>
                <Link href={tab("answers")} className="-mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 py-3 hover:bg-sunken">
                  <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${a.unread ? "bg-coral-soft text-ink" : "bg-sunken text-ink-muted"}`}>
                    {[...a.heading][0]?.toUpperCase() ?? "·"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                      {a.heading}
                      {a.unread && <span className="rounded-full bg-coral-soft px-1.5 text-xs font-semibold text-link">{t.answersNew}</span>}
                      <span className="text-xs font-normal text-ink-muted sm:hidden">{ago(a.createdAt, locale)}</span>
                    </span>
                    <span className="truncate text-ink-muted sm:text-sm">{a.preview}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs text-ink-muted sm:block">{ago(a.createdAt, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <span aria-hidden="true" className="relative flex size-12 shrink-0 items-center justify-center">
      <svg viewBox="0 0 44 44" className="size-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="5" className="stroke-sunken" />
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-lagoon transition-[stroke-dashoffset] duration-700" strokeDasharray={c} strokeDashoffset={c * (1 - done / Math.max(1, total))} />
      </svg>
      <span className="absolute font-display text-sm font-semibold tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
}

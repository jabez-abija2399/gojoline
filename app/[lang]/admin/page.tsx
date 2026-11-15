import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FocusOnMount } from "@/components/admin/focus-on-mount";
import { ModerateForm } from "@/components/admin/moderate-form";
import { ReviewForm } from "@/components/admin/review-form";
import { BuilderHeader } from "@/components/builder/builder-header";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).admin.metaTitle : undefined, robots: { index: false } };
}

const amount = (minor: number) => new Intl.NumberFormat("en-US").format(minor / 100);
const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdSmall = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 });
const usd = (nano: number) => (nano > 0 && nano < 1e7 ? usdSmall : usdFmt).format(nano / 1e9);
/** Text people typed may be in either language; screen readers need to know which. */
const langOf = (s: string) => (/[\u1200-\u137F]/.test(s) ? "am" : "en");
const DONE = ["ok", "deploy_failed", "failed", "not_found"] as const;
const TABS = ["payments", "reports", "sites", "costs"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminPage({ params, searchParams }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  const rawTab = (await searchParams).tab;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "payments";
  const rawDone = (await searchParams).done;
  const done = DONE.find((d) => d === rawDone) ?? null;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/admin`);
  const t = getMessages(lang);
  // Not admin: same answer as a missing page.
  if (!isAdmin(user)) notFound();
  const svc = services();
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <BuilderHeader locale={lang} t={t} user={user} />
      <main id="main" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="text-3xl font-bold">{t.admin.title}</h1>
        <nav aria-label={t.admin.title} className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-white p-1 sm:grid-cols-4">
          {TABS.map((x) => (
            <Link
              key={x}
              href={`/${lang}/admin?tab=${x}`}
              aria-current={x === tab ? "page" : undefined}
              className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-3 font-medium text-ink-muted aria-[current=page]:bg-teal aria-[current=page]:text-white"
            >
              {t.admin.tabs[x]}
            </Link>
          ))}
        </nav>
        {done && (
          <FocusOnMount>
            <p role={done === "ok" ? "status" : "alert"} className={`rounded-lg px-4 py-3 font-medium ${done === "ok" ? "bg-teal-soft text-teal" : "bg-clay-soft text-destructive"}`}>
              {t.admin.tabStatus[done]}
            </p>
          </FocusOnMount>
        )}
        {tab === "payments" && <Payments />}
        {tab === "reports" && <Reports />}
        {tab === "sites" && <Sites />}
        {tab === "costs" && <Costs />}
      </main>
    </>
  );

  async function Payments() {
    const pending = await svc.billing.store().pendingForAdmin();
    return (
        <section aria-labelledby="pay-title" className="flex flex-col gap-3">
          <h2 id="pay-title" className="text-2xl font-bold">{t.admin.paymentsTitle}</h2>
          <p className="text-ink-muted">{t.admin.checkHint}</p>
          {pending.length === 0 ? (
            <p className="text-ink-muted">{t.admin.paymentsEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((p) => (
                <li key={p.id} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
                  <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <p className="font-semibold">{t.billing.productNames[p.product]}</p>
                    <p className="font-semibold">{format(t.billing.price, { price: amount(p.amountMinor) })}</p>
                    <p>{t.billing.methods[p.method]}: <span className="font-mono">{p.reference}</span></p>
                    <p className="break-all">{t.admin.user}: {p.contact ?? p.userId.slice(0, 8)}</p>
                    <p className="text-ink-muted">{dateFmt.format(p.createdAt)}</p>
                  </div>
                  {p.hasReceipt ? (
                    <a href={`/api/admin/payments/${p.id}/receipt`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center font-medium text-teal underline underline-offset-4">{t.admin.viewReceipt}</a>
                  ) : (
                    <p className="text-ink-muted">{t.admin.noReceipt}</p>
                  )}
                  <ReviewForm t={t.admin} id={p.id} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </section>
    );
  }

  async function Reports() {
    const groups = (await svc.moderation?.reports.openBySite(50)) ?? [];
    return (
      <section aria-labelledby="rep-title" className="flex flex-col gap-3">
        <h2 id="rep-title" className="text-2xl font-bold">{t.admin.reportsTitle}</h2>
        {groups.length === 0 ? (
          <p className="text-ink-muted">{t.admin.reportsEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {groups.map((g) => (
              <li key={g.siteId} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono font-semibold">{g.slug}</p>
                  <span className="rounded-full bg-clay-soft px-3 py-1 text-sm font-semibold text-destructive">{format(t.admin.reportCount, { n: g.reports.length, people: g.reporters })}</span>
                </div>
                {g.url && (
                  <a href={g.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 w-fit items-center break-all font-medium text-teal underline underline-offset-4">{t.admin.openSite}</a>
                )}
                <ul className="flex flex-col gap-2">
                  {g.reports.slice(0, 10).map((r) => (
                    <li key={r.id} className="rounded-lg bg-sand p-3">
                      <p className="font-medium">{t.safety.reasons[r.reason]}</p>
                      {r.details && <p lang={langOf(r.details)} className="whitespace-pre-wrap break-words">{r.details}</p>}
                      <p className="text-sm text-ink-muted">{dateFmt.format(r.createdAt)}{r.contact ? ` · ${r.contact}` : ""}</p>
                    </li>
                  ))}
                </ul>
                <ModerateForm t={t.admin} siteId={g.siteId} lang={lang} tab="reports" ops={g.siteStatus === "taken_down" ? ["dismiss"] : ["take_down", "dismiss"]} />
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  async function Sites() {
    const list = (await svc.moderation?.sites.recent(50)) ?? [];
    return (
      <section aria-labelledby="sites-title" className="flex flex-col gap-3">
        <h2 id="sites-title" className="text-2xl font-bold">{t.admin.sitesTitle}</h2>
        {list.length === 0 ? (
          <p className="text-ink-muted">{t.admin.sitesEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((site) => (
              <li key={site.id} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono font-semibold">{site.slug}</p>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${site.status === "published" ? "bg-teal-soft text-teal" : site.status === "taken_down" ? "bg-clay-soft text-destructive" : "bg-sand text-ink"}`}>{t.admin.siteStatus[site.status]}</span>
                </div>
                {site.url && site.status === "published" && (
                  <a href={site.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 w-fit items-center font-medium text-teal underline underline-offset-4">{t.admin.openSite}</a>
                )}
                {site.takenDownReason && (
                  <p className="text-ink-muted">
                    {t.admin.reasonShown}: <span lang={langOf(site.takenDownReason)}>{site.takenDownReason}</span>
                  </p>
                )}
                {site.status === "taken_down" && <ModerateForm t={t.admin} siteId={site.id} lang={lang} tab="sites" ops={site.takedownDeployedAt ? ["restore"] : ["retry", "restore"]} reason={site.takenDownReason ?? "admin"} />}
                {site.status === "published" && (
                  <details>
                    <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-destructive">{t.admin.takeDown}</summary>
                    <ModerateForm t={t.admin} siteId={site.id} lang={lang} tab="sites" ops={["take_down"]} />
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  async function Costs() {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const s = await svc.usageReport.summary(since);
    const purpose = (k: string) => (t.admin.purposes as Record<string, string>)[k] ?? k;
    const table = (title: string, rows: { key: string; costNanoUsd: number; requests: number }[], label: (k: string) => string = (k) => k) => (
      <table className="w-full text-start">
        <caption className="mb-2 text-start text-lg font-semibold">{title}</caption>
        <thead>
          <tr className="border-b border-line text-ink-muted">
            <th scope="col" className="py-2 pe-3 text-start font-medium">{t.admin.costWhat}</th>
            <th scope="col" className="py-2 pe-3 text-end font-medium">{t.admin.costRequests}</th>
            <th scope="col" className="py-2 text-end font-medium">{t.admin.costUsd}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line">
              <th scope="row" className="py-2 pe-3 text-start font-normal break-all">{label(r.key)}</th>
              <td className="py-2 pe-3 text-end tabular-nums">{r.requests}</td>
              <td className="py-2 text-end font-semibold tabular-nums">{usd(r.costNanoUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
    return (
      <section aria-labelledby="costs-title" className="flex flex-col gap-4">
        <h2 id="costs-title" className="text-2xl font-bold">{t.admin.costsTitle}</h2>
        {s.requests === 0 ? (
          <p className="text-ink-muted">{t.admin.costEmpty}</p>
        ) : (
          <>
            <p className="text-lg font-semibold">{format(t.admin.costTotal, { usd: usd(s.costNanoUsd), n: s.requests })}</p>
            {table(t.admin.costByPurpose, s.byPurpose, purpose)}
            {table(t.admin.costByDay, s.byDay)}
            {table(t.admin.costTopUsers, s.topUsers.map((u) => ({ ...u, key: u.key.slice(0, 12) })))}
          </>
        )}
      </section>
    );
  }
}

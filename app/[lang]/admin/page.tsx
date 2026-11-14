import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuilderHeader } from "@/components/builder/builder-header";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { reviewPayment } from "./actions";

export const metadata: Metadata = { robots: { index: false } };

const birr = (minor: number) => new Intl.NumberFormat("en-US").format(minor / 100);

export default async function AdminPage({ params }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/admin`);
  const t = getMessages(lang);
  // Not admin: same answer as a missing page.
  if (!isAdmin(user)) notFound();
  const pending = await services().billing.store().pendingPayments();
  const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <BuilderHeader locale={lang} t={t} user={user} />
      <main id="main" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="text-3xl font-bold">{t.admin.title}</h1>
        <section aria-labelledby="pay-title" className="flex flex-col gap-3">
          <h2 id="pay-title" className="text-2xl font-bold">{t.admin.paymentsTitle}</h2>
          {pending.length === 0 ? (
            <p className="text-ink-muted">{t.admin.paymentsEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((p) => (
                <li key={p.id} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <span>{t.billing.productNames[p.product]}</span>
                    <span className="font-semibold">{birr(p.amountMinor)} ETB</span>
                    <span>{t.billing.methods[p.method]}: <span className="font-mono">{p.reference}</span></span>
                    <span className="text-ink-muted">{dateFmt.format(p.createdAt)}</span>
                    <span className="text-ink-muted">{t.admin.user}: <span className="font-mono">{p.userId.slice(0, 8)}</span></span>
                  </div>
                  {p.hasReceipt ? (
                    <a href={`/api/admin/payments/${p.id}/receipt`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center font-medium text-teal underline underline-offset-4">{t.admin.viewReceipt}</a>
                  ) : (
                    <p className="text-ink-muted">{t.admin.noReceipt}</p>
                  )}
                  <form action={reviewPayment} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="lang" value={lang} />
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="font-medium">{t.admin.note}</span>
                      <input name="note" maxLength={300} className="min-h-11 rounded-lg border border-input px-3 text-base" />
                    </label>
                    <button name="decision" value="approve" className="min-h-11 rounded-lg bg-teal px-4 font-medium text-white hover:bg-teal-deep">{t.admin.approve}</button>
                    <button name="decision" value="reject" className="min-h-11 rounded-lg border border-line px-4 font-medium text-destructive hover:bg-clay-soft">{t.admin.reject}</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

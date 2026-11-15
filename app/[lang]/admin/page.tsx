import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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

export default async function AdminPage({ params }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/admin`);
  const t = getMessages(lang);
  // Not admin: same answer as a missing page.
  if (!isAdmin(user)) notFound();
  const pending = await services().billing.store().pendingForAdmin();
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <BuilderHeader locale={lang} t={t} user={user} />
      <main id="main" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="text-3xl font-bold">{t.admin.title}</h1>
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
      </main>
    </>
  );
}

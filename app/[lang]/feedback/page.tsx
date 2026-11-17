import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { MarkRepliesRead } from "@/components/feedback/mark-read";
import { TYPE_ICONS } from "@/components/feedback/type-icons";
import { currentUser } from "@/lib/auth/session";
import { pagePath } from "@/lib/feedback/schema";
import { FEEDBACK_TYPES, type FeedbackStatus, type FeedbackType } from "@/lib/feedback/types";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/feedback">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).feedback.metaTitle : undefined, robots: { index: false } };
}

/** Text people typed may be in either language; screen readers need to know which. */
const langOf = (s: string) => (/[ሀ-፿]/.test(s) ? "am" : "en");

const statusChip: Record<FeedbackStatus, string> = {
  new: "border border-line bg-paper text-ink",
  seen: "border border-line bg-paper text-ink",
  planned: "bg-ink text-white",
  done: "border border-lagoon bg-white text-lagoon",
  wont_do: "border border-line bg-white text-ink-muted",
};

export default async function FeedbackPage({ params, searchParams }: PageProps<"/[lang]/feedback">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/feedback`);
  const sp = await searchParams;
  // Where the owner came from (a path on this site only), and a type to start with.
  const from = pagePath.safeParse(typeof sp.from === "string" ? sp.from : "");
  const page = from.success && from.data ? from.data : null;
  const initialType = FEEDBACK_TYPES.find((x) => x === sp.type) ?? null;
  const t = getMessages(lang);
  const f = t.feedback;
  const store = services().feedback;
  const items = await store.listForOwner(user.id, 50).catch((e: unknown) => (reportError("feedback list failed", e), null));
  // New replies keep their badge for this visit; the page tells the server they were seen (a POST, never this render).
  const hasUnread = !!items?.some((x) => x.reply && !x.replyReadAt);
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium" });

  return (
    <AppShell locale={lang} t={t} user={user} feedbackUnread={0}>
      {hasUnread && <MarkRepliesRead />}
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:py-10">
        <section aria-labelledby="fb-title" className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2">
            <h1 id="fb-title" className="text-2xl font-semibold tracking-tight">{f.title}</h1>
            <p className="max-w-prose text-ink-muted">{f.intro}</p>
          </div>
          <FeedbackForm t={f} locale={lang} page={page} initialType={initialType} canAttach={user.verified} />
        </section>

        <section id="mine" aria-labelledby="mine-title" className="flex scroll-mt-20 flex-col gap-3">
          <h2 id="mine-title" className="text-lg font-semibold">{f.mineTitle}</h2>
          {items === null ? (
            <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 text-destructive">{f.errors.failed}</p>
          ) : items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-ink-muted">{f.mineEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((x) => {
                const Icon = TYPE_ICONS[x.type as FeedbackType];
                const unread = !!x.reply && !x.replyReadAt;
                return (
                  <li key={x.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Icon aria-hidden="true" className="size-4" /> {f.types[x.type]}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${statusChip[x.status]}`}>{f.ownerStatus[x.status]}</span>
                      {unread && <span className="rounded-full bg-sun px-2.5 py-0.5 text-sm font-semibold text-ink">{f.newReply}</span>}
                      <span className="ms-auto text-sm text-ink-muted">{format(f.sentOn, { date: dateFmt.format(x.createdAt) })}</span>
                    </div>
                    <p lang={langOf(x.message)} className="whitespace-pre-wrap break-words">{x.message}</p>
                    {x.hasScreenshot && (
                      <a href={`/api/feedback/${x.id}/screenshot`} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-3 text-sm font-medium text-ink underline underline-offset-4">
                        {/* eslint-disable-next-line @next/next/no-img-element -- private per-owner picture: next/image would cache it for everyone */}
                        <img src={`/api/feedback/${x.id}/screenshot?size=thumb`} alt="" loading="lazy" width={96} height={64} className="h-16 w-24 rounded-lg border border-line bg-paper object-cover" />
                        {f.viewScreenshot}
                      </a>
                    )}
                    {x.reply && (
                      <div className="flex flex-col gap-1 rounded-xl bg-sunken p-3">
                        <h3 className="text-sm font-semibold">{f.replyTitle}</h3>
                        <p lang={langOf(x.reply)} className="whitespace-pre-wrap break-words">{x.reply}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}

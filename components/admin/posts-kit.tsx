import { CheckCircle2, Download } from "lucide-react";
import { CopyButton } from "@/components/billing/copy-button";
import { markKitPost, sendKitPost } from "@/app/[lang]/admin/posts-actions";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { TELEGRAM_KIT, kitMediaUrl, kitText } from "@/lib/posts/telegram-kit";
import { PostSubmit } from "./post-submit";

type T = Messages["admin"]["posts"];
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-hover pointer-fine:min-h-9";
const quiet = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:border-faint pointer-fine:min-h-9";

/**
 * Admin → Posts → Telegram start: the channel's first posts, in order, two a day. Each can be sent
 * to the connected channel in one click, or copied and posted by hand, then marked as posted.
 */
export function PostsKit({ lang, t, posted, link, channel, message }: { lang: "en" | "am"; t: T; posted: Record<string, string>; link: string; channel: string | null; message: { id: string; ok: boolean; why: string | null; sent: boolean } | null }) {
  const k = t.starter;
  const done = TELEGRAM_KIT.filter((p) => posted[p.id]).length;
  const next = TELEGRAM_KIT.find((p) => !posted[p.id]);
  return (
    <section aria-labelledby="kit-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="kit-title" className="text-base font-semibold">{k.title}</h2>
          <span className="text-sm text-ink-muted">{format(k.progress, { n: done, total: TELEGRAM_KIT.length })}</span>
        </div>
        <p className="text-ink-muted">{k.intro}</p>
        {!channel && <p role="note" className="rounded-lg bg-coral-soft px-3 py-2 text-sm">{k.errors.no_channel}</p>}
      </div>
      <ol className="flex flex-col gap-3">
        {TELEGRAM_KIT.map((p, i) => {
          const isPosted = !!posted[p.id];
          const text = kitText(p, link);
          const msg = message?.id === p.id ? message : null;
          return (
            <li key={p.id} id={`kit-${p.id}`} className={`flex min-w-0 scroll-mt-28 flex-col gap-3 rounded-xl border bg-white p-4 ${next?.id === p.id ? "border-ink" : "border-line"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">{i + 1}</span>
                <h3 className="font-semibold">{p.title}</h3>
                <span className="text-xs text-ink-muted">{format(k.day, { n: p.day })}</span>
                <span className={`ms-auto rounded-full px-2.5 py-1 text-xs font-semibold ${isPosted ? "border border-lagoon text-lagoon" : "bg-sunken text-ink-muted"}`}>
                  {isPosted ? k.posted : next?.id === p.id ? k.next : k.notPosted}
                </span>
              </div>

              {msg && (
                <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-paper text-ink" : "bg-coral-soft text-destructive"}`}>
                  {msg.ok ? (msg.sent ? k.sentOk : k.savedOk) : (k.errors as Record<string, string>)[msg.why ?? ""] ?? k.errors.send}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-2">
                  {p.quiz ? (
                    <div className="rounded-lg border border-line p-3 text-sm">
                      <p className="font-medium">{k.quiz}</p>
                      <ul className="mt-2 flex flex-col gap-1">
                        {p.quiz.options.map((o, j) => (
                          <li key={o} className="flex items-center gap-1.5">
                            {j === p.quiz!.correct ? <CheckCircle2 aria-hidden="true" className="size-4 text-lagoon" /> : <span aria-hidden="true" className="size-4" />}
                            {o}
                            {j === p.quiz!.correct && <span className="sr-only">({k.answer})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : p.media[0]?.kind === "video" ? (
                    <video src={kitMediaUrl(p.media[0].file)} controls preload="none" playsInline className="aspect-[9/16] w-full max-w-56 rounded-lg bg-ink" aria-label={p.title} />
                  ) : (
                    <ul className={`grid gap-1 ${p.media.length > 1 ? "grid-cols-3" : "grid-cols-1"}`}>
                      {p.media.map((m, j) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <li key={m.file}><img src={kitMediaUrl(m.file)} alt={format(k.photoN, { n: j + 1 })} loading="lazy" width={1080} height={1350} className="h-auto w-full rounded-md border border-line" /></li>
                      ))}
                    </ul>
                  )}
                  {p.media.length > 0 && (
                    <ul className="flex flex-wrap gap-1">
                      {p.media.map((m, j) => (
                        <li key={m.file}>
                          <a href={kitMediaUrl(m.file)} download className={quiet}>
                            <Download aria-hidden="true" className="size-4" />
                            {p.media.length > 1 ? format(k.downloadN, { n: j + 1 }) : k.download}
                            <span className="sr-only">: {p.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm [overflow-wrap:anywhere]">{p.quiz ? `${p.quiz.question}\n\n✓ ${p.quiz.options[p.quiz.correct]}: ${p.quiz.explanation}` : text}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={sendKitPost}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="id" value={p.id} />
                      <PostSubmit working={t.working} confirm={format(k.sendConfirm, { title: p.title })} className={primary} label={`${k.send}: ${p.title}`}>
                        {isPosted ? k.sendAgain : k.send}
                      </PostSubmit>
                    </form>
                    {!p.quiz && <CopyButton value={text} what={`${k.copyText}: ${p.title}`} copy={k.copyText} copied={t.copied} />}
                    <form action={markKitPost}>
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="done" value={isPosted ? "0" : "1"} />
                      <PostSubmit working={t.working} className={quiet} label={`${isPosted ? k.unmark : k.mark}: ${p.title}`}>
                        {isPosted ? k.unmark : k.mark}
                      </PostSubmit>
                    </form>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

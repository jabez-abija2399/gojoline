import { Send, UserPlus } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { CopyButton } from "./copy-button";

/** The owner's invite link on the Plan page: copy it or share it on Telegram, and how many joined. */
export function InviteCard({ t, invite, credits, cap }: { t: Messages["growth"]["invite"]; invite: { link: string; stats: { invited: number; rewarded: number } } | null; credits: number; cap: number }) {
  return (
    <section aria-labelledby="invite-title" className="flex scroll-mt-20 flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-coral-soft text-ink">
          <UserPlus className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="invite-title" className="text-lg font-semibold">{t.title}</h2>
          <p className="text-ink-muted">{format(t.body, { n: credits })}</p>
        </div>
      </div>
      {invite ? <InviteLink t={t} link={invite.link} stats={invite.stats} cap={cap} /> : <p role="alert" className="rounded-xl bg-coral-soft px-4 py-3 font-medium text-destructive">{t.loadError}</p>}
    </section>
  );
}

function InviteLink({ t, link, stats, cap }: { t: Messages["growth"]["invite"]; link: string; stats: { invited: number; rewarded: number }; cap: number }) {
  const share = `https://t.me/share/url?${new URLSearchParams({ url: link, text: t.shareText }).toString()}`;
  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor="invite-link" className="text-sm font-medium">{t.linkLabel}</label>
        <div className="flex flex-wrap gap-2">
          <input id="invite-link" readOnly value={link} dir="ltr" className="min-h-11 min-w-0 flex-1 basis-56 rounded-lg border border-input bg-paper px-3 text-base text-ink lg:min-h-9 lg:text-sm" />
          <CopyButton value={link} what={t.copyWhat} copy={t.copy} copied={t.copied} />
          <a href={share} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:border-faint hover:bg-sunken lg:min-h-9">
            <Send aria-hidden="true" className="size-4" />
            {t.shareTelegram}
            <span className="sr-only"> {t.newTab}</span>
          </a>
        </div>
      </div>
      <p className="text-sm text-ink-muted">
        {stats.invited > 0 ? format(t.stats, { invited: stats.invited, rewarded: stats.rewarded }) : t.statsNone} {format(t.rules, { cap })}
      </p>
    </>
  );
}

import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import { WaitlistForm } from "./waitlist-form";

export function Waitlist({ locale, t }: { locale: Locale; t: Messages["waitlist"] }) {
  return (
    <section id="waitlist" aria-labelledby="waitlist-title" className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h1 id="waitlist-title" className="text-3xl display sm:text-4xl">{t.title}</h1>
          <p className="max-w-[60ch] text-lg text-ink-muted">{t.body}</p>
        </div>
        <WaitlistForm locale={locale} t={t} />
      </div>
    </section>
  );
}

import type { Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function Hero({ t }: { t: Messages["landing"]["hero"] }) {
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-16 sm:px-6 md:grid-cols-[1.15fr_1fr] md:items-center md:pt-20 md:pb-24">
      <div className="flex flex-col gap-6">
        <p className="w-fit rounded-full bg-teal-soft px-3 py-1 text-base font-medium text-teal">{t.eyebrow}</p>
        <h1 id="hero-title" className="text-4xl leading-tight font-bold sm:text-5xl">
          {t.title}
        </h1>
        <p className="max-w-[60ch] text-lg text-ink-muted">{t.subtitle}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href="#waitlist">{t.cta}</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how">{t.secondary}</a>
          </Button>
        </div>
      </div>
      <figure aria-hidden="true" className="rounded-[20px] border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-teal px-4 py-3 text-white">
            <p className="text-base font-semibold text-teal-soft">{t.chatUserLabel}</p>
            <p>{t.chatUser}</p>
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-clay-soft px-4 py-3 text-ink">
            <p className="text-base font-semibold text-ink">{t.chatBotLabel}</p>
            <p>{t.chatBot}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="flex items-center gap-1.5 border-b border-line bg-sand px-3 py-2">
              <span className="size-2.5 rounded-full bg-line" />
              <span className="size-2.5 rounded-full bg-line" />
              <span className="size-2.5 rounded-full bg-line" />
            </div>
            <div className="grid gap-2 p-4">
              <div className="h-20 rounded-lg bg-teal" />
              <div className="h-3 w-2/3 rounded bg-line" />
              <div className="h-3 w-1/2 rounded bg-line" />
              <div className="mt-1 grid grid-cols-3 gap-2">
                <div className="h-12 rounded-md bg-clay-soft" />
                <div className="h-12 rounded-md bg-teal-soft" />
                <div className="h-12 rounded-md bg-clay-soft" />
              </div>
            </div>
          </div>
        </div>
      </figure>
    </section>
  );
}

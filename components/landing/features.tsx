import { Banknote, Bell, Globe, Languages, MessageSquareText, ShieldCheck, Send } from "lucide-react";
import type { Messages } from "@/lib/i18n";

export function Features({ t }: { t: Messages["landing"] }) {
  const f = t.features;
  const items = [
    { icon: Languages, ...f.language },
    { icon: Bell, ...f.forms },
    { icon: MessageSquareText, ...f.edits },
    { icon: Banknote, ...f.birr },
    { icon: ShieldCheck, ...f.safe },
    { icon: Globe, ...f.domain },
  ];
  return (
    <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
      <div className="grid gap-10 md:grid-cols-[1fr_320px] md:items-start">
        <div>
          <h2 id="features-title" className="text-3xl font-bold sm:text-4xl">{f.title}</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map(({ icon: Icon, title, body }) => (
              <li key={title} className="reveal group flex gap-4 rounded-xl border border-line bg-white p-5 transition hover:border-teal-mid hover:shadow-md">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal transition group-hover:bg-teal group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-ink-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* A phone-style Telegram notice: what an owner sees when a customer books. */}
        <figure aria-label={t.telegram.title} className="reveal mx-auto w-full max-w-[320px] rounded-[28px] border-8 border-ink bg-[#E6EBEE] p-3 shadow-xl md:mt-16">
          <div className="flex items-center gap-2 rounded-t-xl bg-teal px-3 py-2 text-white">
            <Send aria-hidden="true" className="size-4" />
            <span className="font-semibold">@gojoline_bot</span>
          </div>
          <div className="flex flex-col gap-2 p-2">
            <p className="w-fit max-w-[90%] rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
              <strong className="block">{t.telegram.title}</strong>
              {t.telegram.body}
            </p>
          </div>
        </figure>
      </div>
    </section>
  );
}

import { Banknote, Bell, Languages, MessageSquareText } from "lucide-react";
import type { Messages } from "@/lib/i18n";

export function Features({ t }: { t: Messages["landing"] }) {
  const items = [
    { icon: Languages, ...t.features.language },
    { icon: Bell, ...t.features.forms },
    { icon: MessageSquareText, ...t.features.edits },
    { icon: Banknote, ...t.features.birr },
  ];
  return (
    <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 id="features-title" className="text-3xl font-bold">{t.features.title}</h2>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-4 rounded-xl border border-line bg-white p-6">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal">
              <Icon className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-ink-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-teal p-6 text-white">
          <h2 className="text-2xl font-bold text-white">{t.audience.title}</h2>
          <p className="mt-3 text-teal-soft">{t.audience.list}</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-6">
          <h2 className="text-2xl font-bold">{t.pricing.title}</h2>
          <p className="mt-3 text-ink-muted">{t.pricing.body}</p>
        </div>
      </div>
    </section>
  );
}

import { ChevronDown } from "lucide-react";
import type { Messages } from "@/lib/i18n";

/** Native <details>: opens and closes without any JavaScript. */
export function Faq({ t }: { t: Messages["landing"]["faq"] }) {
  return (
    <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
      <h2 id="faq-title" className="text-3xl font-bold sm:text-5xl">{t.title}</h2>
      <div className="mt-8 flex flex-col gap-3">
        {t.items.map((item) => (
          <details key={item.q} className="group rounded-xl border border-line bg-white open:border-teal-mid open:shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-teal transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

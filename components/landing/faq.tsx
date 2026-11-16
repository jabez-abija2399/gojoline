import { ChevronDown } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { Eyebrow } from "./eyebrow";

/** Native <details>: opens and closes without any JavaScript (smoothly where the browser can). */
export function Faq({ t, eyebrow }: { t: Messages["landing"]["faq"]; eyebrow: string }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="below-fold mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <div className="flex flex-col items-center gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id="faq-title" className="reveal text-center text-3xl display sm:text-5xl">
          {t.title}
        </h2>
      </div>
      <div className="mt-10 flex flex-col gap-3">
        {t.items.map((item) => (
          <details key={item.q} className="faq-item reveal group rounded-2xl border border-line bg-white transition-shadow open:border-faint open:shadow-md">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {item.q}
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sunken transition-colors group-open:bg-ink group-open:text-white">
                <ChevronDown className="size-4 transition-transform duration-300 group-open:rotate-180" />
              </span>
            </summary>
            <p className="px-5 pb-5 text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

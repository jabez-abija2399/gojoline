import type { Messages } from "@/lib/i18n";
import { Tilet } from "./tilet";

/** What we measured on our own test builds, between two woven borders. */
export function Proof({ t }: { t: Messages["landing"] }) {
  return (
    <section aria-labelledby="proof-title" className="bg-teal text-white">
      <Tilet tone="dark" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
        <h2 id="proof-title" className="sr-only">
          {t.proofTitle}
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {t.proof.map((p) => (
            <div key={p.label} className="reveal flex flex-col-reverse justify-end gap-1">
              <dt className="text-teal-soft">{p.label}</dt>
              <dd className="font-display text-4xl font-bold text-clay-light sm:text-5xl">{p.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-sm text-teal-soft">{t.proofNote}</p>
      </div>
      <Tilet tone="dark" />
    </section>
  );
}

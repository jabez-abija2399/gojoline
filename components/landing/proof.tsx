import type { Messages } from "@/lib/i18n";

/** What we measured on our own test builds: four plain numbers. */
export function Proof({ t }: { t: Messages["landing"] }) {
  return (
    <section aria-labelledby="proof-title" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
        <h2 id="proof-title" className="sr-only">
          {t.proofTitle}
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {t.proof.map((p) => (
            <div key={p.label} className="reveal flex flex-col-reverse justify-end gap-1">
              <dt className="text-ink-muted">{p.label}</dt>
              <dd className="font-display text-3xl font-bold text-ink md:text-4xl lg:text-5xl">{p.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-ink-muted">{t.proofNote}</p>
      </div>
    </section>
  );
}

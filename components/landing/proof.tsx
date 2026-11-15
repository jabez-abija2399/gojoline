import type { Messages } from "@/lib/i18n";

/** What we measured on our own test builds: four numbers between hairlines. */
export function Proof({ t }: { t: Messages["landing"] }) {
  return (
    <section aria-labelledby="proof-title" className="border-y border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="proof-title" className="sr-only">
          {t.proofTitle}
        </h2>
        <dl className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {t.proof.map((p, i) => (
            <div key={p.label} className={`reveal flex flex-col-reverse justify-end gap-1 py-8 lg:px-8 lg:first:ps-0 ${i % 2 ? "max-lg:ps-4" : "max-lg:pe-4"} ${i < 2 ? "max-lg:border-b max-lg:border-line" : ""}`}>
              <dt className="text-ink-muted">{p.label}</dt>
              <dd className="text-4xl display text-ink lg:text-5xl">{p.value}</dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-line py-4 text-ink-muted">{t.proofNote}</p>
      </div>
    </section>
  );
}

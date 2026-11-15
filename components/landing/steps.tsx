import type { Messages } from "@/lib/i18n";

export function Steps({ t }: { t: Messages["landing"] }) {
  const s = t.steps;
  const steps = [s.one, s.two, s.three];
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <ul className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {t.proof.map((p) => (
            <li key={p.label} className="reveal flex flex-col items-center rounded-xl bg-sand px-3 py-5 text-center">
              <span className="font-display text-3xl font-bold text-teal">{p.value}</span>
              <span className="text-ink-muted">{p.label}</span>
            </li>
          ))}
        </ul>
        <h2 id="how-title" className="text-3xl font-bold sm:text-4xl">{s.title}</h2>
        <p className="mt-2 text-lg text-ink-muted">{s.intro}</p>
        <ol className="relative mt-10 grid gap-6 md:grid-cols-3">
          {/* The line that joins the steps on wide screens. */}
          <span aria-hidden="true" className="absolute top-6 right-[16%] left-[16%] hidden h-0.5 bg-gradient-to-r from-teal-soft via-clay-light to-teal-soft md:block" />
          {steps.map((step, i) => (
            <li key={step.title} className="reveal relative flex flex-col gap-3 rounded-xl border border-line bg-sand p-6 transition hover:-translate-y-1 hover:shadow-md">
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-teal font-display text-xl font-bold text-white ring-8 ring-white">
                {i + 1}
              </span>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

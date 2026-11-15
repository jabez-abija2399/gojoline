import type { Messages } from "@/lib/i18n";

export function Steps({ t }: { t: Messages["landing"]["steps"] }) {
  const steps = [t.one, t.two, t.three];
  return (
    <section id="how" aria-labelledby="how-title" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="how-title" className="text-3xl font-bold">{t.title}</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-sand p-6">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-teal font-display text-lg font-bold text-white">
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

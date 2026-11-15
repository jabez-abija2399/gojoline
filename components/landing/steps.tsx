import { Check, Send } from "lucide-react";
import type { Messages } from "@/lib/i18n";

/** Three steps, each shown with the real thing an owner sees at that moment. */
export function Steps({ t, prompt, buildSteps, buildTitle, bot }: { t: Messages["landing"]; prompt: string; buildSteps: string[]; buildTitle: string; bot: string }) {
  const s = t.steps;
  const scenes = [
    // 1. What the owner writes.
    <p key="say" className="ms-auto max-w-[92%] rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-white shadow-md">{prompt}</p>,
    // 2. What the builder shows while it works.
    <div key="build" className="w-full rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-3 shadow-md">
      <p className="font-semibold">{buildTitle}</p>
      <ol className="mt-2 flex flex-col gap-1.5">
        {buildSteps.map((step) => (
          <li key={step} className="flex items-center gap-2 text-ink-muted">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-white">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>,
    // 3. What arrives on the owner's phone.
    <div key="tg" className="w-full overflow-hidden rounded-2xl bg-white shadow-md">
      <p className="flex items-center gap-2 bg-ink px-3 py-2 font-semibold text-white">
        <Send className="size-4" /> @{bot}
      </p>
      <p className="px-4 py-3">
        <strong className="block">{t.telegram.title}</strong>
        {t.telegram.body}
      </p>
    </div>,
  ];
  const steps = [s.one, s.two, s.three];
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <h2 id="how-title" className="text-3xl font-bold sm:text-5xl">
          {s.title}
        </h2>
        <p className="mt-3 text-lg text-ink-muted">{s.intro}</p>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <li key={step.title} className="reveal flex flex-col gap-4">
              <div aria-hidden="true" className="flex min-h-48 items-center rounded-3xl bg-paper p-5 md:h-60">
                {scenes[i]}
              </div>
              <div className="flex gap-4">
                <span aria-hidden="true" className="font-display text-5xl leading-none font-bold text-faint">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-ink-muted">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

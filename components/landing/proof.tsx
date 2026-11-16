import Image from "next/image";
import { Check } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { CountUp } from "./count-up";
import { InView } from "./in-view";

const CARDS = ["cafe", "hotel", "salon", "clinic"];

/**
 * What we measured on our own test builds: four numbers, each with a small picture of what it
 * means that plays once as the band scrolls in (a build bar, sites that worked, templates
 * fanning out, two languages). The pictures are decoration; the numbers and words carry it.
 */
export function Proof({ t, locale, cafeName }: { t: Messages["landing"]; locale: "en" | "am"; cafeName: { en: string; am: string } }) {
  const [time, rate, templates, languages] = t.proof;
  // "30 of 30" → 30 squares, 30 lit (from the measured numbers, never invented).
  const [lit, total] = (rate?.value.match(/\d+/g) ?? ["0", "0"]).map(Number) as [number, number];
  const card = "proof-card flex flex-col gap-4 rounded-3xl border border-line bg-white p-5 sm:p-6";
  const visual = "flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-paper";
  return (
    <section aria-labelledby="proof-title" className="below-fold px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <h2 id="proof-title" className="text-center text-3xl display sm:text-5xl">
          {t.proofTitle}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Time to a first site: the build bar fills while each step lights up. */}
          <InView as="li" className={card} style={{ "--i": 0 } as React.CSSProperties}>
            <div aria-hidden="true" className={`${visual} flex-col gap-3 px-5`}>
              <div className="flex w-full justify-between">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="proof-dot flex size-6 items-center justify-center rounded-full bg-lagoon text-white" style={{ "--d": `${300 + i * 260}ms` } as React.CSSProperties}>
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ))}
              </div>
              <span className="block h-2 w-full overflow-hidden rounded-full bg-line">
                <span className="proof-bar block h-full w-full origin-left rounded-full bg-lagoon" />
              </span>
            </div>
            <ProofText value={time?.value ?? ""} label={time?.label ?? ""} />
          </InView>
          {/* Sites built right the first time: one square per test site, lighting up. */}
          <InView as="li" className={card} style={{ "--i": 1 } as React.CSSProperties}>
            <div aria-hidden="true" className={visual}>
              <span className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: Math.min(total, 40) }, (_, i) => (
                  <span key={i} className={`proof-square size-3.5 rounded-[4px] ${i < lit ? "bg-lagoon" : "bg-line"}`} style={{ "--d": `${200 + i * 35}ms` } as React.CSSProperties} />
                ))}
              </span>
            </div>
            <ProofText value={rate?.value ?? ""} label={rate?.label ?? ""} />
          </InView>
          {/* Ready templates: real template cards fanning out from a stack. */}
          <InView as="li" className={card} style={{ "--i": 2 } as React.CSSProperties}>
            <div aria-hidden="true" className={`${visual} relative`}>
              {CARDS.map((id, i) => (
                <span key={id} className="proof-fan absolute w-[46%] overflow-hidden rounded-lg border border-line bg-white shadow-md" style={{ "--r": `${(i - 1.5) * 9}deg`, "--x": `${(i - 1.5) * 26}%`, zIndex: i } as React.CSSProperties}>
                  <Image src={`/templates/${id}/${locale}-card.webp`} alt="" width={640} height={400} sizes="120px" loading="lazy" className="h-auto w-full" />
                </span>
              ))}
            </div>
            <ProofText value={templates?.value ?? ""} label={templates?.label ?? ""} />
          </InView>
          {/* Two languages: the same café, in English and in Amharic, sliding in from each side. */}
          <InView as="li" className={card} style={{ "--i": 3 } as React.CSSProperties}>
            <div aria-hidden="true" className={`${visual} flex-col gap-2`}>
              <span className="proof-lang-a rounded-full border border-line bg-white px-3 py-1.5 font-display font-semibold shadow-sm" lang="en">
                {cafeName.en}
              </span>
              <span className="proof-lang-b rounded-full bg-ink px-3 py-1.5 font-semibold text-white shadow-sm" lang="am">
                {cafeName.am}
              </span>
            </div>
            <ProofText value={languages?.value ?? ""} label={languages?.label ?? ""} />
          </InView>
        </ul>
        <p className="text-center text-sm text-ink-muted">{t.proofNote}</p>
      </div>
    </section>
  );
}

function ProofText({ value, label }: { value: string; label: string }) {
  return (
    <p className="flex flex-col gap-1">
      <span className="whitespace-nowrap text-[clamp(1.9rem,3vw,2.75rem)] display text-ink">
        <CountUp value={value} />
      </span>
      <span className="text-ink-muted">{label}</span>
    </p>
  );
}

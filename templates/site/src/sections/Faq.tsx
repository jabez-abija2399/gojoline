import { SectionTitle } from "../components/SectionTitle";
import { useSite } from "../lib/context";
import type { FaqSection } from "../lib/types";

/** Questions and answers; native <details>, so they open without any script. */
export function Faq({ section }: { section: FaqSection }) {
  const { text } = useSite();
  return (
    <section id={section.id ?? "faq"} className="section bg-surface">
      <div className="container-site grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-16">
        <div className="reveal flex flex-col gap-3">
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {section.intro && <p className="max-w-[45ch] text-muted">{text(section.intro)}</p>}
        </div>
        <div className="reveal border-t border-line">
          {section.items.map((item, i) => (
            <details key={i} className="faq-item">
              <summary>{text(item.question)}</summary>
              <p className="max-w-[65ch] pb-5 whitespace-pre-line text-muted">{text(item.answer)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

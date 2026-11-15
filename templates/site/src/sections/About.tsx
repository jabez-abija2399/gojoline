import { SectionTitle } from "../components/SectionTitle";
import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { AboutSection } from "../lib/types";

export function About({ section }: { section: AboutSection }) {
  const { text } = useSite();
  return (
    <section id={section.id ?? "about"} className="section bg-surface">
      <div className="container-site grid items-center gap-10 md:grid-cols-2">
        <div className="reveal depth-frame me-3.5 mb-3.5">
          <div className="zoom rounded-site">
            <Picture image={section.image} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-site" />
          </div>
        </div>
        <div className="reveal flex flex-col gap-4">
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {text(section.body)
            .split(/\n{2,}/)
            .map((para, i) => (
              <p key={i} className="max-w-[65ch] text-muted">
                {para}
              </p>
            ))}
          {section.highlights && section.highlights.length > 0 && (
            <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {section.highlights.map((h, i) => (
                <div key={i} className="lift rounded-site bg-primary-soft p-4">
                  <dt className="text-muted">{text(h.label)}</dt>
                  <dd className="font-heading text-2xl font-bold">{text(h.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

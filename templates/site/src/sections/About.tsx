import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { AboutSection } from "../lib/types";

export function About({ section }: { section: AboutSection }) {
  const { text } = useSite();
  return (
    <section id={section.id ?? "about"} className="section bg-surface">
      <div className="container-site grid items-center gap-10 md:grid-cols-2">
        <Picture image={section.image} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-site" />
        <div className="flex flex-col gap-4">
          <h2 className="section-title">{text(section.heading)}</h2>
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
                <div key={i} className="rounded-site bg-primary-soft p-4">
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

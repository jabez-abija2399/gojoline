import { Icon } from "../components/Icon";
import { Picture } from "../components/Picture";
import { SectionHead } from "../components/SectionHead";
import { useSite } from "../lib/context";
import type { AboutSection } from "../lib/types";

export function About({ section }: { section: AboutSection }) {
  const { text, href } = useSite();
  return (
    <section id={section.id ?? "about"} className="section bg-surface">
      <div className="container-site grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className={`reveal depth-frame me-3.5 mb-3.5 ${section.imageSide === "end" ? "md:order-last" : ""}`}>
          <div className="zoom rounded-site">
            <Picture image={section.image} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-site" />
          </div>
        </div>
        <div className="reveal flex flex-col gap-4">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} />
          {text(section.body)
            .split(/\n{2,}/)
            .map((para, i) => (
              <p key={i} className="max-w-[65ch] text-muted">
                {para}
              </p>
            ))}
          {section.points && section.points.length > 0 && (
            <ul className="mt-1 flex flex-col gap-2.5">
              {section.points.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 flex-none items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon name="check" className="size-4" />
                  </span>
                  <span>{text(p)}</span>
                </li>
              ))}
            </ul>
          )}
          {section.highlights && section.highlights.length > 0 && (
            <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {section.highlights.map((h, i) => (
                <div key={i} className="highlight lift flex flex-col-reverse justify-end rounded-site bg-primary-soft p-4">
                  <dt>{text(h.label)}</dt>
                  <dd className="font-heading text-2xl font-bold">{text(h.value)}</dd>
                </div>
              ))}
            </dl>
          )}
          {section.action && (
            <a href={href(section.action.href)} className="btn btn-outline mt-2 w-fit">
              {text(section.action.label)}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

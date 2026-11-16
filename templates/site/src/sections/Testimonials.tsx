import { SectionHead } from "../components/SectionHead";
import { useSite } from "../lib/context";
import type { TestimonialsSection } from "../lib/types";

export function Testimonials({ section }: { section: TestimonialsSection }) {
  const { text } = useSite();
  const n = section.items.length;
  return (
    <section id={section.id ?? "testimonials"} className="section on-dark bg-accent text-on-accent">
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} />
        <ul className={`grid gap-6 ${n === 1 ? "" : n === 2 || n === 4 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {section.items.map((item, i) => (
            <li key={i}>
              <figure className="reveal lift flex h-full flex-col gap-4 rounded-site border border-current/20 bg-current/5 p-6">
                <blockquote className={n === 1 ? "pull-quote" : "text-lg"}>“{text(item.quote)}”</blockquote>
                <figcaption className="mt-auto flex flex-col">
                  <span className="font-semibold">{typeof item.name === "string" ? item.name : text(item.name)}</span>
                  {item.role && <span className="opacity-80">{text(item.role)}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

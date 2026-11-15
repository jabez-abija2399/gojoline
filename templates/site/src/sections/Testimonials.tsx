import { SectionTitle } from "../components/SectionTitle";
import { useSite } from "../lib/context";
import type { TestimonialsSection } from "../lib/types";

export function Testimonials({ section }: { section: TestimonialsSection }) {
  const { text } = useSite();
  return (
    <section id={section.id ?? "testimonials"} className="section bg-accent text-on-accent">
      <div className="container-site flex flex-col gap-8">
        <SectionTitle>{text(section.heading)}</SectionTitle>
        <ul className="grid gap-6 md:grid-cols-3">
          {section.items.map((item, i) => (
            <li key={i}>
              <figure className="reveal lift flex h-full flex-col gap-4 rounded-site border border-current/20 bg-current/5 p-6">
                <blockquote className="text-lg">“{text(item.quote)}”</blockquote>
                <figcaption className="mt-auto font-semibold">{item.name}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { GallerySection } from "../lib/types";

export function Gallery({ section }: { section: GallerySection }) {
  const { text } = useSite();
  return (
    <section id={section.id ?? "gallery"} className="section bg-surface">
      <div className="container-site flex flex-col gap-8">
        <h2 className="section-title">{text(section.heading)}</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {section.images.map((image, i) => (
            <li key={i}>
              <Picture image={image} sizes="(min-width: 768px) 33vw, 50vw" className="aspect-square w-full rounded-site" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

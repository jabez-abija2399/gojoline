import { SectionTitle } from "../components/SectionTitle";
import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { GallerySection } from "../lib/types";

export function Gallery({ section }: { section: GallerySection }) {
  const { text } = useSite();
  const big = section.images.length >= 5;
  return (
    <section id={section.id ?? "gallery"} className="section bg-surface">
      <div className="container-site flex flex-col gap-8">
        <SectionTitle>{text(section.heading)}</SectionTitle>
        {/* Editorial grid: with 5+ photos the first is large and the rest fill around it. */}
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {section.images.map((image, i) => (
            <li key={i} className={`zoom reveal rounded-site ${big && i === 0 ? "col-span-2 row-span-2" : ""}`}>
              <Picture image={image} sizes={big && i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="aspect-square size-full rounded-site" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

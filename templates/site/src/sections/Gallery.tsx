import { SectionTitle } from "../components/SectionTitle";
import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { GallerySection } from "../lib/types";

export function Gallery({ section }: { section: GallerySection }) {
  const { text } = useSite();
  const count = section.images.length;
  const big = count >= 5;
  // Few photos: as many columns as photos on wide screens, and on phones an odd first photo
  // runs full width, so no row ends with a gap.
  const cols = big || count >= 4 ? "md:grid-cols-4" : count === 3 ? "md:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
  const wideFirst = !big && count % 2 === 1;
  return (
    <section id={section.id ?? "gallery"} className="section bg-surface">
      <div className="container-site flex flex-col gap-8">
        <SectionTitle>{text(section.heading)}</SectionTitle>
        {/* Editorial grid: with 5+ photos the first is large and the rest fill around it. */}
        <ul className={`grid grid-cols-2 gap-3 md:gap-4 ${cols}`}>
          {section.images.map((image, i) => (
            <li key={i} className={`zoom reveal rounded-site ${big && i === 0 ? "col-span-2 row-span-2" : wideFirst && i === 0 ? "max-md:col-span-2" : ""}`}>
              <Picture image={image} sizes={big && i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className={`size-full rounded-site ${wideFirst && i === 0 ? "aspect-[2/1] md:aspect-square" : "aspect-square"}`} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

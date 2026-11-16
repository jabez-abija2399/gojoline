import { Picture } from "../components/Picture";
import { SectionHead } from "../components/SectionHead";
import { useSite } from "../lib/context";
import type { GallerySection } from "../lib/types";

export function Gallery({ section }: { section: GallerySection }) {
  const { text } = useSite();
  const count = section.images.length;
  if (section.layout === "scroll") {
    return (
      <section id={section.id ?? "gallery"} className="section overflow-hidden">
        <div className="container-site flex flex-col gap-8 md:gap-10">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
          {/* A row to swipe: tall and wide photos alternate, like a contact sheet. */}
          <ul role="group" tabIndex={0} aria-label={text(section.heading)} className="rail">
            {section.images.map((image, i) => (
              <li key={i} className={`zoom flex-none snap-start rounded-site ${i % 3 === 1 ? "w-[78vw] sm:w-[30rem]" : "w-[58vw] sm:w-[22rem]"}`}>
                <Picture image={image} sizes="(min-width: 640px) 30rem, 160px" className="h-72 w-full rounded-site sm:h-96" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }
  const big = count >= 5;
  // Few photos: as many columns as photos on wide screens, and on phones an odd first photo
  // runs full width, so no row ends with a gap.
  const cols = big || count >= 4 ? "md:grid-cols-4" : count === 3 ? "md:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-1";
  const wideFirst = !big && count % 2 === 1;
  return (
    <section id={section.id ?? "gallery"} className="section">
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        {/* Editorial grid: with 5+ photos the first is large and the rest fill around it. */}
        <ul className={`grid grid-cols-2 gap-3 md:gap-4 ${cols}`}>
          {section.images.map((image, i) => (
            <li key={i} className={`zoom reveal rounded-site ${big && i === 0 ? "col-span-2 row-span-2" : wideFirst && i === 0 ? "max-md:col-span-2" : ""}`}>
              <Picture image={image} sizes={big && i === 0 ? "(min-width: 768px) 50vw, 160px" : "(min-width: 768px) 25vw, 120px"} className={`size-full rounded-site ${wideFirst && i === 0 ? "aspect-[2/1] md:aspect-square" : "aspect-square"}`} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

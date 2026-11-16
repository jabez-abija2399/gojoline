import { useState } from "react";
import { Lightbox } from "../components/Lightbox";
import { Picture } from "../components/Picture";
import { Rail } from "../components/Rail";
import { SectionHead } from "../components/SectionHead";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { GallerySection, Image } from "../lib/types";

export function Gallery({ section }: { section: GallerySection }) {
  const { text, lang } = useSite();
  const [open, setOpen] = useState<number | null>(null);
  const count = section.images.length;
  // Each photo opens large. Drawings (no photo yet) don't.
  const photo = (image: Image, i: number, picture: React.ReactNode) =>
    image.src ? (
      <button type="button" onClick={() => setOpen(i)} aria-label={`${uiText("openPhoto", lang)}: ${text(image.alt)}`} className="block size-full cursor-zoom-in">
        {picture}
      </button>
    ) : (
      picture
    );
  const photos = section.images.filter((im) => im.src).length;
  const viewer = photos > 0 && <Lightbox images={section.images.filter((im) => im.src)} index={open} onChange={setOpen} onClose={() => setOpen(null)} />;
  if (section.layout === "scroll") {
    return (
      <section id={section.id ?? "gallery"} className="section overflow-hidden">
        <div className="container-site flex flex-col gap-8 md:gap-10">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
          {/* A row to swipe: tall and wide photos alternate, like a contact sheet. */}
          <Rail label={text(section.heading)}>
            {section.images.map((image, i) => (
              <li key={i} className={`zoom flex-none snap-start rounded-site ${i % 3 === 1 ? "w-[78vw] sm:w-[30rem]" : "w-[58vw] sm:w-[22rem]"}`}>
                {photo(image, i, <Picture image={image} sizes="(min-width: 640px) 30rem, 160px" className="h-72 w-full rounded-site sm:h-96" />)}
              </li>
            ))}
          </Rail>
        </div>
        {viewer}
      </section>
    );
  }
  if (section.layout === "wall" && count >= 3) {
    // Columns of photos drifting up and down in turn (motion.css); still for visitors who ask for less motion.
    const cols = [0, 1, 2].map((c) => section.images.map((image, i) => ({ image, i })).filter(({ i }) => i % 3 === c));
    return (
      <section id={section.id ?? "gallery"} className="section overflow-hidden">
        <div className="container-site flex flex-col gap-8 md:gap-10">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
          <div className="photo-wall">
            {cols.map((col, c) => (
              <ul key={c} className={`photo-wall-col ${c === 1 ? "is-down" : ""} ${c === 2 ? "max-md:hidden" : ""}`}>
                {[...col, ...col].map(({ image, i }, k) => (
                  <li key={k} aria-hidden={k >= col.length || undefined} className="zoom rounded-site">
                    {k < col.length ? photo(image, section.images.slice(0, i).filter((im) => im.src).length, <Picture image={image} sizes="(min-width: 768px) 33vw, 160px" className="aspect-[4/5] w-full rounded-site" />) : <Picture image={image} sizes="(min-width: 768px) 33vw, 160px" className="aspect-[4/5] w-full rounded-site" />}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        {viewer}
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
            <li key={i} style={{ "--i": i % 4 } as React.CSSProperties} className={`zoom reveal wipe rounded-site ${big && i === 0 ? "col-span-2 row-span-2" : wideFirst && i === 0 ? "max-md:col-span-2" : ""}`}>
              {photo(
                image,
                section.images.slice(0, i).filter((im) => im.src).length,
                <Picture image={image} sizes={big && i === 0 ? "(min-width: 768px) 50vw, 160px" : "(min-width: 768px) 25vw, 120px"} className={`size-full rounded-site ${wideFirst && i === 0 ? "aspect-[2/1] md:aspect-square" : "aspect-square"}`} />,
              )}
            </li>
          ))}
        </ul>
      </div>
      {viewer}
    </section>
  );
}

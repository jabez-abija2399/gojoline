import { useState } from "react";
import { Lightbox } from "../components/Lightbox";
import { PauseButton } from "../components/PauseButton";
import { Picture } from "../components/Picture";
import { Rail } from "../components/Rail";
import { SectionHead } from "../components/SectionHead";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { GallerySection, Image } from "../lib/types";

export function Gallery({ section }: { section: GallerySection }) {
  const { text, lang, site } = useSite();
  // A film is shown in the dark: on cinematic sites every gallery sits on the dark band.
  const dark = site.theme.style === "cinematic";
  const [open, setOpen] = useState<number | null>(null);
  const [wallPaused, setWallPaused] = useState(false);
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
  if (section.layout === "prints") {
    // White-framed prints laid slightly askew; each straightens when pointed at (motion.css).
    return (
      <section id={section.id ?? "gallery"} className={`section overflow-hidden ${dark ? "bg-accent text-on-accent on-dark" : ""}`}>
        <div className="container-site flex flex-col gap-8 md:gap-10">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
          <ul className="prints">
            {section.images.map((image, i) => (
              <li key={i} className="print reveal" style={{ "--i": i % 3, "--tilt": `${[-3, 2, -1.5, 2.5, -2][i % 5]}deg` } as React.CSSProperties}>
                {photo(image, i, <Picture image={image} sizes="(min-width: 768px) 30vw, 160px" className="aspect-[4/5] w-full" />)}
              </li>
            ))}
          </ul>
        </div>
        {viewer}
      </section>
    );
  }
  if (section.layout === "scroll") {
    return (
      <section id={section.id ?? "gallery"} className={`section overflow-hidden ${dark ? "bg-accent text-on-accent on-dark" : ""}`}>
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
    const column = (n: number, c: number) => section.images.map((image, i) => ({ image, i })).filter(({ i }) => i % n === c);
    const wall = (n: number, className: string) => (
      <div className={`photo-wall ${className}`} style={{ "--cols": n } as React.CSSProperties}>
        {Array.from({ length: n }, (_, c) => {
          const col = column(n, c);
          return (
            <ul key={c} className={`photo-wall-col ${c % 2 === 1 ? "is-down" : ""}`}>
              {[...col, ...col].map(({ image, i }, k) => (
                <li key={k} aria-hidden={k >= col.length || undefined} className="zoom rounded-site">
                  {k < col.length ? photo(image, section.images.slice(0, i).filter((im) => im.src).length, <Picture image={image} sizes="(min-width: 768px) 33vw, 160px" className="aspect-[4/5] w-full rounded-site" />) : <Picture image={image} sizes="(min-width: 768px) 33vw, 160px" className="aspect-[4/5] w-full rounded-site" />}
                </li>
              ))}
            </ul>
          );
        })}
      </div>
    );
    return (
      <section id={section.id ?? "gallery"} data-paused={wallPaused || undefined} className={`section overflow-hidden ${dark ? "bg-accent text-on-accent on-dark" : ""}`}>
        <div className="container-site flex flex-col gap-8 md:gap-10">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro}>
            <PauseButton photos paused={wallPaused} onToggle={() => setWallPaused((p) => !p)} className="pause-btn-inline" />
          </SectionHead>
          {/* Every photo shows on phones too: two columns there, three on computers. */}
          {wall(2, "md:hidden")}
          {wall(3, "max-md:hidden")}
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
  // museum hangs the photos as an uneven 7/5, 5/7 grid (museum.css): wider files on computers.
  const museum = site.theme.style === "museum";
  return (
    <section id={section.id ?? "gallery"} className={`section ${dark ? "bg-accent text-on-accent on-dark" : ""}`}>
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        {/* Editorial grid: with 5+ photos the first is large and the rest fill around it. */}
        <ul className={`gallery-mosaic grid grid-cols-2 gap-3 md:gap-4 ${cols}`}>
          {section.images.map((image, i) => (
            <li key={i} style={{ "--i": i % 4 } as React.CSSProperties} className={`zoom reveal wipe rounded-site ${big && i === 0 ? "col-span-2 row-span-2" : wideFirst && i === 0 ? "max-md:col-span-2" : ""}`}>
              {photo(
                image,
                section.images.slice(0, i).filter((im) => im.src).length,
                <Picture image={image} sizes={museum ? (i % 4 === 0 || i % 4 === 3 ? "(min-width: 768px) 50vw, 160px" : "(min-width: 768px) 35vw, 160px") : big && i === 0 ? "(min-width: 768px) 50vw, 160px" : "(min-width: 768px) 25vw, 120px"} className={`size-full rounded-site ${wideFirst && i === 0 ? "aspect-[2/1] md:aspect-square" : "aspect-square"}`} />,
              )}
            </li>
          ))}
        </ul>
      </div>
      {viewer}
    </section>
  );
}

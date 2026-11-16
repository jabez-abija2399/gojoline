# Cafe / restaurant: motion and interaction brief

## Sites visited (1280x800 + 390x844, in `motion/cafe/`)
- **deltacafes.com** (Awwwards SOTD Nov 2026): Lenis, custom carousels with progress bars, several MP4s. 16 to 26 MB.
- **dishoom.com** (admired brand): Swiper, sticky hero, CSS keyframe illustrations, an audio "Listen in" button. 3 to 9 MB at load.
- **ethosbistro.com** (listed on Awwwards May 2025; award not confirmed): Next.js, Slick, parallax image layers. 40 to 100 MB of images: a warning.
- **noma.dk** (admired brand): WordPress, autoplay hero video, otherwise static. 18 MB of images. On the re-run the mobile capture loaded only a 216 KB one-screen page, probably a bot challenge, so only the desktop capture is usable.

## Patterns, ranked by impact

1. **Sticky "Order / Book a table" bar.** Ethos pins a full-width "ORDER ONLINE" bar to the bottom on phones. Dishoom keeps a "Book" pill in the header. CSS only. Phone: Call / WhatsApp / Directions bar.
2. **Hero that is "a window into the room".** Dishoom's video sits in an inset frame and grows to full width as you scroll (`home-hero-inner sticky`). A Hindi greeting caption sits above an English quote, which maps directly to Amharic over English. Delta shows a full-bleed landscape with small tiles numbered 01/02/03. Build: CSS `position: sticky` plus a scale tied to scroll (JS or `view()`). Phones: static photo, keep the bilingual caption.
3. **Scroll-linked text fill.** Dishoom's intro paragraph darkens word by word as you scroll ("its rich history *and its endless eccentricities*" stays grey). It needs JS (one small IntersectionObserver per word) or CSS `view()` with a per-word `animation-range`. Reduced motion: show it fully coloured.
4. **Menu carousels with arrows, tags and categories.** Dishoom recipes carry tag chips ("CAFÉ CLASSIC", "MAINS") and arrow buttons. Delta's origin cards (Brazil, Cuba) show a progress bar under the track. CSS scroll-snap and buttons. A category tab row that filters dishes needs about 20 lines of JS.
5. **Large condensed headlines with a heritage line.** Delta: "DESDE 1961, CAFÉ QUE DESPERTA HISTÓRIAS" and "O CICLO DO CAFÉ". Typographic, plus a fade-up on enter (CSS keyframe and IntersectionObserver).
6. **Coffee-journey diagram.** Delta draws four circles on a photo (Origens, Torra, Blend, Prova) joined by thin lines. Inline SVG; drawing the line on enter is CSS `stroke-dashoffset`. It fits Ethiopian coffee ceremony steps very well.
7. **Location list as big type.** Dishoom lists its cafés in large serif type over one full-bleed photo. Static CSS. Reuse it for opening hours.
8. **Parallax photo layers and slideshow.** Ethos has two `parallax-image-layer` divs (translateY up to 355 px) and a hero slider with dots and a pause button. Dated; if there is a slideshow, always include pause.

## Avoid
Unoptimised images (Ethos sends 100 MB on mobile, Noma 18 MB). Autoplay video without a poster (Dishoom mobile showed a black box for seconds). Floating product scatter (Delta quiz).

## Not observable
Hover zoom on dish cards and the menu overlay. Cookie dialogs still show in the first two top-of-page shots.

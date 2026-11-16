# School (school / training): motion and interaction

## Sites visited (1280x800 + 390x844, 9 shots each; school/<site>-d|m<n>.jpg + .json)
- **korowa.vic.edu.au** (Awwwards HM 2026): all 18 shots. Webflow + GSAP/ScrollTrigger + Swiper; 8 CSS `animation-timeline` rules; 0.37 MB transferred (images lazy).
- **quakerschool.org** (HM 2026): all 18 shots. Next.js + Lenis, HLS hero video, 1.3-1.7 MB.
- **overlake.org** (Awwwards nominee): all 18 shots. Slick + jQuery; 5 autoplay videos + audio = **56-62 MB**: a warning.
- **krackerz.com** (HM 2026, design bootcamp): all 18 shots. Framer + Lenis, 1.7-2.5 MB, red preloader on phone.

## Patterns, ranked by impact
1. **Age-stage cards with photo + age range** (Korowa "Early Learning: Ages 3 & 4 / Junior School: Prep to Year 6 / Senior"; Quaker coloured "Pathways" K-8 / Upper / Real World cards with Explore). Desktop: three tall arched cards; Korowa grows the hovered/active card. Phone: vertical stack. CSS-only; hover expand is hover-only.
2. **Card stack that pins and overlaps while scrolling** (Korowa leadership "Year 9 / Year 10 / Year 11" cards: hidden at load, revealed and stacked; same idea fits "Admissions in 4 steps"). CSS `position: sticky` with increasing `top`; no JS. Phone: works (Korowa keeps it). Reduced motion: still fine, it is just layout.
3. **Scroll-driven image cloud** (Korowa "Exceptional education. Inside and outside the classroom": centre photo scales up while side photos drift; Quaker "Everyday" big word with floating photos and "Watch now"). Korowa does it in CSS `animation-timeline: view()` with keyframes `center-image-scale-in`, `side-image-parallax`. Unsupported browsers just show the static grid. Reduced motion: off.
4. **Warm photo hero with two-tone headline** (Korowa "We don't make *ladies*" in script red; Quaker "Seen & valued" over video). Static is enough; Quaker's hero video is the heavy part. Use a photo; optional slow CSS zoom.
5. **Hero/news photo slider with dash pager** (Overlake: 5 slides, dash indicators, text fades up). Use scroll-snap + dots, never autoplay video.
6. **Marquee strip of campus photos** (Overlake `scrollMarquee` "uneven-img-slider" moving left). CSS keyframes, pause on hover and under reduced motion; lazy small images.
7. **Line-by-line statement reveal** (Quaker "At TQS, your child is seen and understood..." spans fade/slide in; 51 elements hidden at load on desktop). Small IntersectionObserver; content visible by default.
8. **Coloured section bands** (Quaker yellow/green/coral; Korowa lavender) and **Inquire / Visit / Apply** three-colour button bar (Overlake footer). Pure CSS, strong at 360 px.

## Avoid
Autoplay video (Overlake 56 MB), preloaders (Korowa, Krackerz: blank first screen on phone), smooth-scroll libraries, Framer runtime (~400 KB JS).

## Hover-only
Quaker: 82 hover transforms (card lift, image zoom). Korowa arched cards expand on hover. Krackerz stickers are draggable (desktop toy).

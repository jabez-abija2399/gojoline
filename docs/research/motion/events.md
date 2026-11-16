# Events / weddings: motion and interaction brief

## Sites visited (1280x800 + 390x844, in `motion/events/`)
- **boutiqueweddings.cz** (Awwwards listing, Prague planner): Webflow IX, Splide (+ auto-scroll extension), Lottie, CSS marquee, autoplay videos. 5 to 6 MB.
- **avagyanphoto.com** (Awwwards HM Jan 2026, wedding photographer): no libraries; CSS keyframes only (`scrollYAnimCol1..3`). 6 to 7 MB of photos.
- **calderclark.com** (destination weddings): Showit, Embla; the parallax is real CSS `view-timeline` (`--shwt-scroll`). About 1 MB.
- **davidstarkdesign.com** (event design studio): GSAP (TweenMax) and animate.css `fadeInUp`. 2.4 MB.
- **mindyweiss.com** (admired planner): jQuery marquee, Flickity. 1.4 MB.
- Failed: alessandrazanghi.com (Awwwards SOTD) returned 502 from the proxy. Fooror returned 502 as well.

## Patterns, ranked by impact

1. **Couple or name as a moving marquee over the hero.** Boutique Weddings runs a huge serif "agentura Boutique wedding..." across the bottom of a looping video. Mindy Weiss runs a black press-quote strip ("Over the Moon 'Top Planner'"). CSS `@keyframes` translateX on duplicated text. On phones the text is shorter and slower. Reduced motion: static and clipped. Cost: nothing.
2. **Photo wall that scrolls by itself.** Avagyan shows three or four columns of wedding photos moving vertically in opposite directions after a "100%" preloader. CSS keyframes only. On phones use two columns with small lazy-loaded thumbnails (<60 KB each). Reduced motion: static grid.
3. **Framed crossfade slideshow.** Calder Clark puts an ornate arch frame in the centre of a letterpress-textured page; photos crossfade inside it, with an embossed wordmark below. The shape is CSS `clip-path` or `mask`; the fade is a keyframe opacity loop with no library. Works on phones as is.
4. **Stationery or paper intro.** David Stark stacks paper cards on load (grid paper, then envelope, then lined note) across our 0 / 600 / 2000 ms shots. CSS keyframe stagger. It suits invitations: an "envelope opens" moment. Make it shorter on phones and skip it with reduced motion.
5. **Mixed italic/bold display words.** Boutique Weddings sets "Amore *Forever*", "Clean *Contemporary*", "Your *Niche* Story". Typography only. It gives a style chooser for wedding themes.
6. **Carousels with arrows, dots and "+" expanders.** Boutique has "Kapitoly svatby" (services), venues and stories, each with round arrows and dots; "Management svatby +" expands. Splide is used there, but CSS scroll-snap plus `<details>` is enough.
7. **Fade-up captions and offset photo collage.** David Stark's white-bordered photos sit at angles and captions fade up as you scroll (`fadeInUp` x16). IntersectionObserver plus a CSS class; reduced motion: none.
8. **Testimonials with big quote marks.** Mindy Weiss uses oversized quote glyphs; the quote text fades, with the next lines greyed. A CSS opacity cycle. Boutique uses a reference slider with the couple's names.

## Avoid
Webflow IX and Lottie, which are heavy for what they do. Autoplay video heroes on phones. Instagram embeds (broken image alt text appeared in Boutique's grid).

## Not observable
Hover overlays on the gallery, the menu-open animation and any sound. Screenshots show end states only.

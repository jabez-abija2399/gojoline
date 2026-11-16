# Hotel: motion and interaction brief

## Sites visited (1280x800 + 390x844, top x3 + 7 scroll steps each, in `motion/hotel/`)
- **thedrake.ca/thedrakehotel** (Awwwards SOTD Sep 2025, by Locomotive): Lenis, Swiper, Swup. 6 to 25 MB, mostly Vimeo video.
- **tengilemalamala.com** (Awwwards SOTD Oct 2026): Next.js + Lenis, CSS keyframe marquee. 7 to 12 MB (hero video 4.8 to 7.8 MB).
- **mooserhotel.at** (Awwwards HM Jul 2025): GSAP + ScrollTrigger + SplitText, Swiper, 3 autoplay videos. 7 to 13 MB.
- **aman.com** (admired brand): jQuery + Slick, CSS keyframe slide-fade-ins only.

## Patterns, ranked by impact

1. **Pinned booking CTA.** Drake shows a floating "Book a room" pill at the bottom centre once you scroll. Aman shows a full-width "Reserve" bar on phones. This is CSS only (`position: sticky/fixed`). Phone: bottom bar with WhatsApp/Call and Book, clear of the safe area. Cost: nothing.
2. **Image parallax inside a fixed frame.** On every Tengile image, the image is scaled to 1.12 and its translateY drifts 5 to 45 px as you scroll; the frame does not move. CSS `animation-timeline: view()` works in Chromium (Calder Clark uses it); elsewhere the image just stays still. Phones: halve the drift. Reduced motion: off.
3. **Headline reveal on load.** Drake boxes each word in a tag and staggers them in (`anim-stagger-words`); at 600 ms on mobile the headline was not there yet. Mooser fades SplitText letters in ("alpinen" was half visible). CSS keyframes with an `animation-delay` per word are enough. Never split Ethiopic into letters: animate whole words. Reduced motion: show at once.
4. **Arch or oval image masks.** Mooser's dining photo sits in an oval and the mountain photo is revealed through a growing circle. The static shape is CSS (`border-radius` or `clip-path`). Animating the clip on scroll needs JS or `view()`. Reduced motion: keep the static shape.
5. **Rooms and offers carousels.** Mooser rooms use prev/next arrows. Drake "What's On" uses arrows and a "1 / 6" counter. Build with CSS scroll-snap plus two buttons, with no library. Phones get native swipe.
6. **Marquee ribbons.** Tengile scrolls staff portraits sideways. Mooser has a ribbon of guest-quote pills ("Psssst ..."). This is a CSS `@keyframes` translateX loop. Reduced motion: stop it.
7. **Scattered "image cloud".** Small wildlife photos drift on x and y around Tengile's centred "Preserving Life's Balance" heading. It needs JS or `view()`. Use it for at most one section; on phones fall back to a static scatter.
8. **Big number or stat.** Mooser prints a giant faded "34" behind "34 Menschen fühlen sich wohl". Static; a count-up is optional JS.

## What to avoid
Autoplay hero video. Every award winner here uses one, and it is the biggest single cost (4 to 14 MB). Use a poster image and a tap-to-play button (Tengile has a "Play Video" button). Also skip Lenis smooth scroll and Swup page transitions on low-end Android.

## Not observable
Hover states and cursor effects; screenshots show end states, not timing.

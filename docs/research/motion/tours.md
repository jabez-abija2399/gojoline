# Tours: motion and interaction brief

## Sites visited (1280x800 + 390x844, in `motion/tours/`)
- **armenia.travel** (Awwwards HM Jan 2026): Next.js + Swiper, a sticky "slides" section, autoplay hero video. 4 MB desktop, 23 MB mobile (16 MB of video).
- **thetailor.com** (Awwwards listing, travel design): WordPress + Slick, autoplay video. Images reach 27 MB on mobile.
- **wildernessdestinations.com** (admired safari brand): Nuxt. Desktop scroll was locked inside a container (consent layer), so only the mobile scroll sequence is usable.
- **andbeyond.com** (admired brand): WordPress, hero video, mostly static. About 3 MB.

## Patterns, ranked by impact

1. **Hero with a soft bottom edge and a "Scroll" cue.** armenia.travel puts its video in a frame with large rounded bottom corners, plus a vertical "SCROLL" label and a small animated arrow. Wilderness overlays a round play button on a still photo (the video opens on tap). Build: CSS `border-radius` and a keyframe nudge on the arrow. Use a still image and an optional play button. Reduced motion: no arrow bounce.
2. **Image collage that assembles on scroll.** On armenia.travel, photo tiles fly in around a centre card that grows into a full-width aerial photo (`si-slides` sticky container). It needs JS, or `view()` on a sticky section. On phones it becomes a simple stacked sequence: big statement text first, then the photo. Use at most one per page.
3. **Category tabs that filter trips.** armenia.travel uses icon pills (Art & Culture, Culinary, Nature & Adventure). andBeyond has filter dropdown chips (traveller type, destination, interest). About 20 lines of JS, or radio inputs with `:has()`. Make the pills scroll horizontally on phones. High value, low cost.
4. **Destination strips.** Wilderness stacks country bands (BOTSWANA, ZAMBIA, RWANDA) in wide-tracked capitals over thin photo strips. Static CSS: on Ethiopia sites this could be the regions (Lalibela, Simien, Danakil, Omo). Add a subtle zoom on tap or hover.
5. **Swipe card deck.** armenia.travel tilts its "Breathtaking Sights" cards at angles, like a fanned deck. Wilderness's "Game drives" cards have arched image tops and peek off the right edge. Build with CSS scroll-snap and `rotate`. Phones get native swipe.
6. **Floating help or enquire button.** armenia.travel has a "Questions?" chat pill and, on phones, a bottom dock (map, search, menu, saved, calendar). Wilderness keeps "ENQUIRE" in the header. CSS fixed. For Gojoline: WhatsApp/Telegram plus "Enquire".
7. **Accordions for trip details and FAQ.** Wilderness (Wildlife, Guides, Architecture ...) uses round chevron toggles. Native `<details>`, with no JS.
8. **Footer wordmark and live widget.** armenia.travel ends with a giant orange "ArMENIA" wordmark and a weather + local-time card. The wordmark is CSS. The weather needs an API, so skip it, or show static "best season" info instead.

## Avoid
Hero video on phones (16 MB). Booking.com-style search widgets embedded from third parties. Skeleton placeholders that stay grey on slow networks (armenia.travel's sticky section showed blank cards).

## Not observable
Hover zoom on tiles, the drag behaviour of the carousels and transition timings.

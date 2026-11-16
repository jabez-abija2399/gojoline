# Business (company / consulting / agency): motion and interaction

## Sites visited (1280x800 + 390x844, 9 shots each; business/<site>-d|m<n>.jpg + .json)
- **versett.com** (Awwwards SOTD, consultancy): all 18 shots. Slick, autoplay hero video, CSS ring/square icon keyframes, 6.6 MB (5.3 MB video).
- **weareenvoy.com** (SOTD, consultancy): all 18 shots. No libraries; reveal class; 7.8 MB of autoplay MP4s.
- **ideo.com** (admired brand): all 18 shots. Webflow + Swiper, 111 KB transferred (images lazy).
- **stripe.com** (admired brand): all 18 shots. Next + WebGL wave canvas, 1.7 MB, 1.3 MB JS.

## Patterns, ranked by impact
1. **Section reveal: fade + 80 px rise** (Envoy `.reveal` on every block; Stripe bento cards). IntersectionObserver + CSS transition, <1 KB. Phone: same. Reduced motion: show instantly. Default visible if JS fails.
2. **Featured work as full-width cards whose background colour changes per project** (Envoy: Verizon red, Nike orange, HyperX purple; client, one-line outcome, service tags). CSS colour per card; transition between them on scroll is optional. Phone: stacked cards. Video thumbnails should be posters.
3. **Logo strip as slow marquee** (Stripe `logo-carousel__marquee` under hero). CSS keyframes, duplicated list, pause on hover/reduced motion.
4. **Proof numbers band** (Stripe "135+ currencies, $1.9T, 99.999%, 200M+"; live ticking "Global GDP running on Stripe 1.7505246%" changed between the two top shots). Count-up on view, static final values in HTML.
5. **Filter tabs over case studies** (Versett sticky "All / Enterprise / Startup / Venture" filter above project grid). Tiny JS toggling `hidden`; sticky bar is CSS. Phone: horizontal scroll chips.
6. **Case-study / insight carousel** (IDEO "Featured Work" swiper, 500 px slide per step; testimonials with arrows). Scroll-snap row + prev/next buttons, no library.
7. **Numbered services list with animated line icons** (Versett 01 Design a new product / 02 Improve / 03 Launch with looping ring/square SVG icons; footer "01-06" service list). CSS keyframes on SVG; stop under reduced motion.
8. **FAQ accordion + loud closing CTA bar** (IDEO lime "Learn more about IDEO..." / "Ask us for references"). `<details>` element, zero JS.

## Avoid
Autoplay reels (Versett, Envoy 5-8 MB), WebGL wave (Stripe canvas), heavy framework bundles.

## Hover-only
IDEO card lift + "Read more" arrow; Versett 21 hover transforms; Envoy link underlines.

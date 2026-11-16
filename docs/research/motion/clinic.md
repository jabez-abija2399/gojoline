# Clinic (health / dental): motion and interaction

## Sites visited (Playwright, 1280x800 + 390x844, 9 shots each, files clinic/<site>-d|m<n>.jpg + <site>.json)
- **aventuradentalarts.com** (Awwwards SOTD 2026): all 18 shots. Lenis, Swiper, split text, Nuxt; 7 sticky blocks; 5.4 MB (1.2 MB webm hero).
- **studiobrusco.com** (SOTD 2023): desktop 9 shots after 2nd run; mobile blocked by a 2-step Italian consent wall. Lenis, full-screen slider, CSS marquee.
- **hellotend.com** (admired brand): all 18 shots. Splide + jQuery, 0.7 MB.
- **southcliffdentalgroup.com** (HM 2026): desktop screenshots timed out (WebGL); mobile 7 shots: Three.js cloud canvas + 3D gold tooth, 5.1 MB.
- avenirclinic.com (SOTD) returned 525: not visited.

## Patterns, ranked by impact
1. **Sticky photo + scrolling text split** (Aventura "Our Solutions", services, technology list 01/06). The photo stays pinned on one side while the service list scrolls past; the active row brightens. CSS-only (`position: sticky`). Phone: stacks to photo-then-list, no pin (Aventura drops it to 3 sticky elements on mobile). Reduced motion: nothing to change. Weight: zero JS.
2. **Line-by-line text reveal on enter** (Aventura "Our goal is...", 19-30 elements hidden at load). Each line slides up from a mask. JS (IntersectionObserver) + CSS transition; ~1 KB. Phone: same, shorter distance. Reduced motion: show instantly. Risk: content invisible if JS fails, so default to visible.
3. **Gentle photo parallax on smiling-patient portraits** (Tend: alternating `parallaxImg--normal/--reverse`, 70-100 px drift). JS scroll handler or CSS `animation-timeline: view()`. Disable on phone (Tend does) and under reduced motion.
4. **Rotating trust ticker under the header** (Tend "Dental done differently · No judgment ever · Outcomes, not quotas", 25 s CSS loop; Brusco teal address banner, 45 s). CSS keyframes only. Phone: keep, it is the one place to say "Open today / Emergency 24/7". Reduced motion: stop and show first item.
5. **Services as a horizontal chip/card carousel** (Tend "Dental Exams / Emergency Care / Oral Hygiene" with arrow; Aventura procedures swiper with 01/04 counter). Use CSS scroll-snap, not a library. Phone: swipe. Reduced motion: unaffected.
6. **Stats as circles that drift in / count up** (Aventura "20K+ satisfied patients, 3 locations, 27K crowns"). Count-up via small JS; final number in HTML. Reduced motion: static.
7. **Testimonial slider with numbered pager** (Aventura 01/04 arrows; Tend reviews carousel with stars). Scroll-snap row + buttons.
8. **Full-screen video slider with giant word** (Brusco STUDIO / TEAM / SERVIZI / CONTATTI, wheel advances slide). Impressive but 4 x 1080p Vimeo files; on our slow connections use a still photo + Ken Burns CSS zoom instead.

## Avoid
WebGL hero (South Cliff: canvas stalled headless screenshots for 30 s), autoplay hero video (Aventura 1.2 MB), smooth-scroll hijack (Lenis on 3 of 4 sites): breaks native phone scrolling feel and costs JS.

## Hover-only (desktop)
Aventura: 68 hover-transform rules (buttons grow "+" icon, list rows shift). Brusco: custom circular cursor. Treat as bonus, never as the only cue.

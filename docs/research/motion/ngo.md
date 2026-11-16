# NGO / charity: motion and interaction

## Sites visited (Playwright, 1280×800 and 390×844; `ngo/<site>-d|m<n>.jpg`, `ngo/<site>.json`)
- **ageofunion.com** (Awwwards-listed nonprofit): GSAP + Lenis on WordPress. Intro fade (the top screen differed by 50/255 after 600 ms), thick rules that draw in, huge headlines, a world-map video loop, a footer that is revealed from underneath. About 20 MB, mostly video.
- **oceanx.org** (Awwwards SOTD Feb 2026): Next.js. The hero image fades in from black (intro diff 63), mapbox canvas "Where is the OceanXplorer now?" with a "Live updates" label, full-bleed photo bands. 12 MB.
- **charitywater.org** (admired): donation widget in the hero, theme tabs, a 100% ring, live counters, a mapbox project map, a carousel of action cards. 8.7 MB with many trackers; a cookie banner covered the lower screen.
- **givedirectly.org** (admired): donation widget in the hero, stat cards with bar charts, a story carousel, an impact counter with a world map. 2.4 MB.

## Patterns, ranked by impact
1. **Donation amount picker in the hero.** *Where:* the first screen, over or beside the photo (charity: water, GiveDirectly). *What:* a Once/Monthly toggle, 3 or 4 amount chips plus "Other". The button label updates ("Give $60 monthly") and so does an impact line ("Gives 12 people clean water every year"). Small JS state. *Phone:* full-width card under the headline. *Reduced motion:* no change. *Weight:* tiny. For us: Birr chips, with the payment step going to the manual provider.
2. **Impact numbers that count up.** *Where:* the proof band (charity: water "22,051,391 people served · last updated", GiveDirectly "2,275,381 people reached"). *How:* IntersectionObserver plus `requestAnimationFrame`, about 30 lines. *Reduced motion:* show the final number. Always render the real number in the HTML.
3. **Theme tabs that swap a photo and a sentence.** *Where:* "Why it matters" (Health / Education / Women / Economic growth as pills over a photo). *How:* ARIA tabs with a crossfade. *Phone:* pills wrap above the image. *Weight:* lazy-load the images for the other tabs.
4. **Story carousel with snap scrolling.** *Where:* the beneficiary stories ("Didier upgraded his barbershop…"), with arrows on desktop and a swipe on phone (GiveDirectly, charity: water). *How:* CSS `scroll-snap` plus two arrow buttons, no Swiper. *Reduced motion:* fine as is.
5. **Progress visuals.** *Where:* transparency and fundraising: a 100% ring that draws in (charity: water) and bars that grow (GiveDirectly `cash-chart-fade`). *How:* CSS keyframes on SVG `stroke-dashoffset` or `scaleX`, triggered when the element enters view. *Weight:* none. The same component works as a campaign goal bar.
6. **Headlines and rules that draw in.** *Where:* section openers (Age of Union "Stories of change", with black rules growing). *How:* CSS `scaleX` on view. *Reduced motion:* static.
7. **Map of where we work.** *Where:* the impact section (charity: water mapbox clusters, OceanX ship tracker, GiveDirectly static map with countries highlighted). For us: **an inline SVG map of Ethiopia with highlighted regions**, no mapbox.
8. **Footer revealed from underneath.** Closing "Join / Give" CTA (Age of Union). CSS sticky. Optional.

## Avoid
Background video loops (Age of Union 20 MB), mapbox/WebGL, smooth scroll, and many tracking scripts (charity: water took 18 s to reach network idle).

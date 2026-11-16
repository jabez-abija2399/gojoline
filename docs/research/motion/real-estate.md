# Real estate: motion and interaction

## Sites visited (1280x800 + 390x844, 9 shots each; real-estate/<site>-d|m<n>.jpg + .json)
- **belgradearbor.rs/en** (Awwwards SOTD + Dev Award, Oct 2026): all 18 shots (2nd run). Next + Lenis + Three.js, 4.5-8.5 MB, 285 elements hidden at load, sketch-to-photo preloader.
- **lenvalproperties.com** (HM 2026, developer): all 18 shots. Webflow + GSAP/ScrollTrigger + Lenis + Swiper + Lottie + Three + Barba: every library at once.
- **silver-pinewood.com** (Awwwards SOTD 2025): all 18 shots (2nd run). Desktop is a wheel-driven scene (doc height = 1 screen); Three + Barba.
- **compass.com** (admired brand): all 18 shots. Flickity, 4 MB, almost no scroll motion.

## Patterns, ranked by impact
1. **Listing card with in-card photo carousel** (Compass: arrows on hover, "1/36" counter, dots; badges "SEE IT FIRST / COMING SOON"). Use a scroll-snap strip inside the card + counter; lazy-load photo 2+ only after swipe. Phone: swipe works natively. Reduced motion: no change.
2. **Buy / Rent / Sell segmented tabs above search** (Compass hero). Pure UI state, tiny JS. Works at 360 px.
3. **Filter chips over a map/amenity list** (Silver Pinewood mobile "SPORTS / EDUCATION / SHOPPING / ACTIVITIES" over a neighbourhood map; Belgrade "What's around: Railway Station, Elementary School, Airport City" with map pins). For us: chips filtering a static list + one static map image; no map SDK.
4. **Sticky full-bleed project photos stacking** (Lenval: each project card is sticky, next one slides over, "VIEW PROJECT" follow-cursor label; Silver Pinewood "sticky--under-next"). CSS `position: sticky` stack; phone works. Hover cursor label is desktop-only.
5. **Big serif headline that reveals word by word / blurs in** (Belgrade "A NEW CHAPTER IN PRESTIGIOUS LIVING" letters un-blur; Lenval split words "Exceptional ... Spaces for Refined Living" slide apart). Small JS or CSS `animation-timeline`; reduced motion: plain text.
6. **Photos in shaped masks with slow parallax** (Belgrade tree-canopy-shaped image frames drifting 900 px vs scroll; Silver Pinewood offset photo collage). CSS clip-path + gentle translate; turn off parallax on phone.
7. **Unit counter + request button** (Belgrade "80 units available / SUBMIT A REQUEST"; status badges). Static number, optional count-up.
8. **Before/after image** (Compass Concierge "Before / After" split photo). Draggable slider with `<input type=range>` + clip-path; ~1 KB.

## Avoid
WebGL 3D tours, hero video (Belgrade 5 MB video), page transitions (Barba), cloud/fluid canvases (Lenval "fluid-cur"), preloaders: all heavy and the first screen is empty on a slow phone (Belgrade mobile shot 0-1 = sketch preloader only).

## Hover-only
Lenval "VIEW PROJECT" circle cursor; Silver Pinewood 52 hover transforms; Compass carousel arrows appear on hover (phone uses swipe).

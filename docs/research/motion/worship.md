# Worship (church): motion and interaction

## Sites visited (Playwright, 1280×800 and 390×844; `worship/<site>-d|m<n>.jpg`, `worship/<site>.json`)
- **generation.church** (Awwwards Honorable Mention 2022): GSAP + ScrollTrigger + Splide. "WELCOME HOME" marquee strips (CSS `marquee` keyframes), a circular text badge that rotates ("Watch Generation Church Online"), parallax images, the latest message as a video thumbnail, ministry cards in a carousel. 3 MB.
- **marinerschurch.org** (frequently listed): AOS fade-ups, a "Transformational Loop" ring graphic whose dot travels as you scroll, a sermon-series carousel, testimony video cards, locations with times. 13.8 MB on desktop, 3.3 MB on mobile.
- **elevationchurch.org** (admired): an HLS hero video with visible pause and mute buttons, a sticky icon tab bar on phone (Sermons / Locations / About / Giving / Groups), dot carousels, colour-block ministry cards. 3.5 MB.
- **flatironschurch.com** (often cited): an autoplaying 720p header video of the latest message, Rellax parallax corner, animate.css. **77 MB**, which is a cautionary example.
- **life.church** (admired): a location picker in the hero, a pulsing "Live" indicator (`live`, `churchonlinelive` keyframes). Desktop only: the mobile load returned an empty page.

## Patterns, ranked by impact
1. **Service times and location in the hero.** *Where:* the first screen. *What:* "Choose a location" leads to times (Life.Church), and a "Join us live: Sat 3:00, Sun 8:45…" block (Generation). *How:* a native `<select>` or tabs by day, no library. *Phone:* full width. *Weight:* none. For us: tabs by day (Sunday Kidase, weekday prayers), including Ethiopian calendar dates.
2. **"Live now" pill.** *Where:* the nav or the hero (Life.Church, Elevation). *What:* a red dot that pulses while a service is streaming, computed from the schedule. *How:* CSS keyframes plus a JS time check. *Reduced motion:* a static dot.
3. **Latest message card.** *Where:* right after the hero (Generation "The latest message: …", Flatirons). *What:* a poster with a play button. Clicking it loads the YouTube embed (facade). **Never autoplay video.** *Weight:* one image until tapped.
4. **Welcome marquee.** *Where:* a strip between sections ("WELCOME · HOME" in both directions, Generation). *How:* CSS `@keyframes translateX` on duplicated text. *Reduced motion:* static. *Weight:* zero. This fits Amharic well ("እንኳን ደህና መጡ").
5. **Sticky quick-action bar.** *Where:* under the header on phone (Elevation: icons that scroll sideways). *How:* CSS sticky plus overflow-x. Ours would hold Times · Location · Give · Watch.
6. **Rotating circular badge.** *Where:* the "Watch online" or "Plan a visit" CTA (Generation). *How:* SVG `textPath` with a slow CSS rotate. Works the same on a phone. *Reduced motion:* still.
7. **Swipe rows of cards.** *Where:* ministries, events, sermon series (Elevation, Mariners, Generation). *How:* CSS `scroll-snap` with dots or arrows. Use it instead of Splide or Swiper.
8. **Fade-up reveal and soft parallax.** *Where:* section blocks (Mariners AOS, Flatirons Rellax). *How:* IntersectionObserver plus CSS. Skip parallax on phone. *Reduced motion:* off.

## Avoid
Header background video (Flatirons 77 MB, Elevation HLS), animate.css and AOS bundles, carousel libraries.

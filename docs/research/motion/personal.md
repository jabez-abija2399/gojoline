# Personal / portfolio: motion and interaction

## Sites visited (Playwright, 1280×800 and 390×844; screenshots `personal/<site>-d|m<n>.jpg`, detection `personal/<site>.json`)
- **henriheymans.com** (Awwwards SOTD Feb 2025): WebGL blob intro behind a "Click to enter" gate, Lenis, letters split into chars, awards list. 3.4 MB.
- **olivierlarose.com** (Awwwards-listed): Astro + Lenis, intro where the name grows into a stacked hero, sticky hero, project table. Light.
- **dennissnellenberg.com** (Awwwards SOTD): GSAP + ScrollTrigger + Locomotive + Barba. Endless name marquee, loader. The desktop CSS failed to load in headless, so I only saw the layout on mobile.
- **brittanychiang.com** (admired): Next.js with no motion library. Sticky left column, a light that follows the cursor, hover cards.

## Patterns, ranked by impact
1. **Hero name that animates in.** *Where:* the hero. *What:* the name appears small, then its lines slide up one after another into a big stacked block (Olivier). Dennis runs it as an endless marquee. *How:* CSS keyframes on `translateY` per line, plus a CSS marquee. *Phone:* same, smaller type. *Reduced motion:* show the final state. *Weight:* none. Keep it under 1 s and never hide content behind a loader.
2. **Project list as a table with row hover.** *Where:* the work section. *What:* rows of Project / Category / Client / Year. On hover the row turns black (Olivier, Henri), and Henri also shows a floating preview image that follows the cursor. The divider lines draw in from left to right as rows enter. **Hover only.** *How:* CSS `:hover`, plus about 20 lines of JS for the image that follows the cursor. *Phone:* a plain tappable list with a small thumbnail. *Weight:* lazy-load the previews.
3. **Sticky hero that the content slides over.** *Where:* between the hero and the work list. *What:* the hero stays in place and fades while the list scrolls up over it (Olivier: the hero opacity changed between scroll steps). *How:* CSS `position: sticky`, plus a scroll-driven opacity (`animation-timeline: view()`, with an IntersectionObserver fallback). *Reduced motion:* no fade. *Weight:* none.
4. **Sticky section labels and active nav.** *Where:* on desktop, a sticky left column with About / Experience / Projects; the active item's line grows. On phone, blurred sticky section headers (Brittany). *How:* CSS sticky, plus an IntersectionObserver for the active item. Works the same on a phone. *Weight:* none. This is the most useful pattern and is completely safe.
5. **Reveal on scroll.** *Where:* each section. *What:* blocks fade and rise as they enter. Dennis's phone screens stayed blank until revealed: a risk. *How:* IntersectionObserver plus a CSS class. Content must be visible without JS. *Reduced motion:* off.
6. **Hover dims the other cards.** *Where:* experience and project cards. *What:* the hovered card lifts with a tinted background while its siblings fade (Brittany). **Hover only.** CSS `:has()`/`:hover`. *Phone:* plain cards.
7. **Contact close.** Footer: "Let's work together", a round "Get in touch" button, email and phone pills, local time (Dennis). The magnetic button is hover only. CSS plus a per-minute clock.
8. **Cursor spotlight.** A soft radial gradient follows the mouse (Brittany). Off on phone; optional.

## Avoid
WebGL intros and "click to enter" gates (Henri), smooth-scroll libraries (Lenis, Locomotive), page-transition routers (Barba) and loaders. They add weight, slow the first screen and break native scrolling on cheap phones.

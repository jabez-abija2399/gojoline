# Mosque / Islamic centre: motion and interaction

## Sites visited (Playwright, 1280×800 and 390×844; `mosque/<site>-d|m<n>.jpg`, `mosque/<site>.json`)
- **cambridgecentralmosque.org** (the most admired UK mosque site): a prayer strip in the top bar with Gregorian and Hijri dates, Begins/Jama'at rows, **the next prayer (Zuhr 13:00) shown in gold**, a Revolution Slider hero, fade-in rows, YouTube embeds for the sermon, a back-to-top button. 8 MB.
- **eastlondonmosque.org.uk**: a prayer table under the logo with both dates, a crossfading news carousel, Quick Donate chips (£30/£50/£100/Other), a live radio embed (Mixlr), a floating WhatsApp button, `totaliser-grow` keyframes for appeal bars. 3.6 MB.
- **greenlanemasjid.org**: a hero slider next to a **tabbed panel (Prayer Times | Activities)** with a **live ticking clock** (I confirmed 11:59:39 became 11:59:41) and sun/moon icons for each prayer. 2.2 MB.
- **grandemosqueedeparis.fr** (admired, Wix): news cards with paging, a fixed-background parallax band ("Préparer une visite"), a monthly timetable posted as an image, which is an anti-pattern. 5.8 MB.
- Failed: szgmc.gov.ae (timed out), qubamasjid.org.uk (proxy tunnel failed), icnyc.org (empty page), and masjidbox.com/prayer-times/… (redirected to a marketing page).

I found no award-level mosque sites. Motion in this niche is modest; the best "live" feel comes from data, not decoration.

## Patterns, ranked by impact
1. **Today's prayer strip with the next prayer highlighted.** *Where:* the top bar or directly under the hero (Cambridge, East London). *What:* Fajr to Isha with Begins / Jama'ah. The next prayer is highlighted, and a **countdown "Asr in 1 h 12 min"** improves on what any of these sites does. *How:* about 40 lines of JS against a prebuilt timetable JSON. Update the countdown every minute and re-highlight when a prayer time passes. *Phone:* 5 columns fit at 360 px. *Reduced motion:* no change (it is text). *Weight:* tiny.
2. **Dual date line.** *Where:* above the prayer strip ("16 November 2026 · 6 Jumādā al-Ākhirah 1448"). For us, add the Ethiopian calendar date. *How:* `Intl.DateTimeFormat` with the `islamic-umalqura` and `ethiopic` calendars. Zero weight.
3. **Prayer / Activities tabs with a live clock.** *Where:* the hero side panel (Green Lane). *How:* ARIA tabs plus a clock that ticks each second, or each minute on low-power devices.
4. **Jumu'ah pill.** *Where:* the header ("JUM'A 12:15 & 13:00"). Static, and on Fridays it gains a "Today" emphasis.
5. **Quick-donate chips with an appeal progress bar.** *Where:* after the services (East London). *What:* amount chips, "Other", and a bar that grows for the current appeal (masjid build, Ramadan iftar). *How:* CSS `scaleX` when the bar enters view. *Reduced motion:* static.
6. **Service cards.** *Where:* Nikah, Janazah, Madrasa, Shahada (Cambridge: coloured top border, fade-in on scroll). *How:* IntersectionObserver plus CSS.
7. **Live audio / Friday khutbah.** *Where:* a "Listen" or "Friday sermon" block (East London Mixlr, Cambridge YouTube). Use a click-to-load facade; never autoplay.
8. **Floating WhatsApp button.** *Where:* bottom right on phone (East London). CSS fixed. Must not cover the donate CTA.

## Avoid
Hero sliders (Revolution Slider), timetables posted as images, Wix's heavy runtime, parallax on phone.

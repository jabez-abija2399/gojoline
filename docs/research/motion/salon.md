# Salon / barber / spa: motion and interaction brief

## Sites visited (1280x800 + 390x844, in `motion/salon/`)
- **giellygreen.co.uk** (Awwwards HM Jan 2026): Nuxt + Lenis + Swiper, 11 sticky panels. 2.6 MB.
- **kalmmoments.com** (Awwwards HM Feb 2025, Bangkok head spa): WordPress/Elementor, CSS pulse keyframes. 1.7 to 1.9 MB.
- **effectownia.pl** (CSS Nectar SOTD May 2025, Warsaw salon): WordPress, CSS `fadeBottom/Left/Right` reveals. 0.6 to 0.8 MB: the lightest site.
- **hershesons.com** (admired brand): Shopify, Flickity, AOS, autoplay video. 26 MB (20 MB of video), plus an email popup that covers half the phone screen.
- Failed: crispbarbershop (Awwwards HM 2026) and luisnetohair: the domain guesses did not resolve, and awwwards.com would not render through the proxy to get the real URLs.

## Patterns, ranked by impact

1. **Floating "Book now" pill and glass header.** Gielly pairs a pill header ("Book now", account, bag). Kalm uses a dark blurred header with a white "Book Now" pill. Effectownia pins an "Umów wizytę" button bottom-left. CSS fixed plus `backdrop-filter`. Visible on every phone screen.
2. **Stacked sticky panels.** Gielly's full-bleed photo panels (voucher, locations, head spa, quiz, artists) each pin while the next slides over. CSS `position: sticky; top: 0` on each section. Works on phones; nothing to disable for reduced motion.
3. **Service cards with price, duration and steps.** Kalm: "Head Spa, From 690 THB, up to 1,290", a check list of steps, "View packages", and a "SIGNATURE" badge. Effectownia: a numbered 01 to 06 service grid plus a price accordion. Static, plus `<details>`. The conversion core.
4. **Stylist or artist cards with an expandable review.** Effectownia: portrait, role, specialty in the accent colour, "Poznaj profil", and a "Poznaj najnowsze opinie" toggle. Gielly: a black-and-white artist portrait grid. Use `<details>` and a grayscale-to-colour change on tap or focus.
5. **Social-proof chips and live badges.** Kalm's hero pill reads "★ 4.9 on Google · 500+ Happy Guests", and a pulsing "Limited slots per day" badge uses the `km-pulse` keyframe. Hershesons shows a "4.8 based on 1,684 Google reviews" card. CSS keyframe pulse. Reduced motion: no pulse.
6. **UGC video or photo strip.** Kalm has a horizontal scroller of TikTok guest clips; Effectownia shows its Instagram feed. Use CSS scroll-snap with thumbnails only and load video on tap.
7. **Line-art location illustration plus a map row.** Gielly draws its salon facades as line art on burgundy. Kalm's branch cards show "3 MIN WALK FROM BTS", opening hours, and "View Map" / "Call Now". Inline SVG, static. Ethiopian equivalent: a nearby landmark or taxi stop.
8. **Channel buttons for booking.** Kalm's closing CTA "Your most relaxing hour in Bangkok" has LINE / WhatsApp / Email / Messenger buttons. For us: Telegram / WhatsApp / Call. Static, after an FAQ accordion.

## Avoid
Autoplay video (Hershesons 20 MB), email popups on load and Lenis smooth scroll. Effectownia proves a fast plain site can win.

## Not observable
Hover image swaps on service cards and the menu overlay animation. My automated `animation-timeline` counts were false positives from `all: unset`.

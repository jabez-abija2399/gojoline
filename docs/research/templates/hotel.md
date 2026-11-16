# Hotel / lodge / guest house: design brief

Method note: pages were read as text (structure, copy, CTAs, card fields). Fonts and colours could not be measured that way; the typography and palette sections are my recommendations informed by prior knowledge of these brands, not values sampled this session.

## Sites opened and what I took from each
- **aman.com**: no booking bar; one "Reserve" in the header. Cards = small eyebrow label + title + one line + "Discover more". Wide, people-free, golden-hour architecture photos.
- **singita.com**: hero is three short lines of poetry, no button. Lodge cards = photo + location line + name, with country filter pills. Booking bar (lodge, dates, guests, "Check availability") sits at the *bottom*, after the story. Conservation/community block as trust.
- **thehoxton.com**: booking bar in hero (location, dates, guests, "Find a Room"); offer card beside the headline ("25% off, 2+ nights"); "Best rate? Book here" direct-booking message; playful sentence-case copy, uppercase CTAs.
- **acehotel.com**: "Welcome to ..." + one paragraph; persistent Book Now; offer cards with dual CTA (Book Now / View offer); events feed.
- **tengilemalamala.com** (Awwwards Site of the Day, Oct 2026): uppercase two-word hero ("UNMATCHED ABUNDANCE"), single CTA "Explore Collection", header "Enquire"; cards show **suite counts**; press quote carousel; story, conservation, community; closes on "Plan your stay".
- **limalimolodge.com** (Simien, Ethiopia): hero = location line + "Book Your Stay"; the same CTA repeated 3 times; three image tiles (Amenities / The Simiens / Gallery); Instagram grid; partner logos as trust. No phone, no prices: a gap to beat.
- **gheraltalodgetigrai.com** (Ethiopia): weak site, but two things travellers need: **travel distances** ("two hours from Mekelle airport") and a TripAdvisor badge.
- **Framer hotel template category** (Venturia, Asterre, The Hotel, Maravilla...): category promise is "rooms, amenities, galleries and booking links".
- Not readable: andbeyond.com (cookie wall only), webflow.com hotel templates (fetch error), Squarespace gallery (no template data returned).

## Hero pattern
Full-bleed single photo (exterior at dusk, pool, or view from the terrace), dark gradient at the bottom. Text: small location eyebrow ("Lalibela, Ethiopia"), a 2 to 5 word headline, one sentence. One primary button ("Check availability" / "Book your stay") plus one quiet link ("See rooms"). City hotels put a compact dates + guests bar in the hero; lodges keep the hero clean and put the enquiry form lower. For Gojoline: no multi-field bar at 360 px; one button that opens a short enquiry (dates, guests, name, phone).

## Home page order
1. Header: logo, EN/አማ switch, Book button
2. Hero
3. Fact strip: rating, "from ETB x / night", distance from airport, breakfast included
4. Welcome / story, 2 short paragraphs + one image
5. Rooms: 3 to 4 room cards
6. Amenities icon grid (Wi-Fi, breakfast, airport pickup, parking, hot water, generator)
7. Dining + coffee ceremony / spa / experiences (image tiles)
8. Gallery (6 to 8 photos)
9. Guest reviews with source and score
10. Location: map, distances, how to get here
11. Booking / enquiry form + phone, WhatsApp, Telegram
12. Footer: address, policies, socials

## Signature UI elements
- **Room card**: 4:3 photo, room name, one line, icon row (guests, bed type, m², view), "from ETB 4,500 / night", "Book" button.
- Eyebrow labels in small tracked caps above every heading.
- Rating badge ("4.7 / 5 · 212 reviews").
- Amenity icons in a 2-column grid on mobile.
- "Best rate when you book direct" line near every booking CTA.
- Distance chips ("15 min from Bole Airport").

## Typography
High-contrast display serif for headings (Cormorant Garamond, Playfair Display or Fraunces), sentence case, tight line-height, 32 to 40 px on mobile; humanist sans for body (Inter, Manrope) 16 px. Eyebrows 11 to 12 px uppercase, letter-spacing 0.12 to 0.18em. Buttons sans, medium weight, generous padding. Latin serifs have no Ethiopic glyphs: pair with Noto Serif Ethiopic / Noto Sans Ethiopic and check line-height (Ethiopic needs about 1.5).

## Palettes
- **Highland Lodge** (earth + forest): primary `#A65A2E` terracotta, dark accent `#1F3A2E` forest green, light background `#F6F0E6` warm linen, text `#2A211C`.
- **Addis Boutique** (ink + brass): primary `#B08D4A` brass, dark accent `#16263A` midnight blue, light background `#FAF7F2` ivory, text `#1C1C1E`.

## Photo style
Wide, quiet, architectural. Blue-hour exteriors with warm lights, pool or terrace with the view, made-up beds shot straight on in daylight, hands-only detail shots (coffee from a jebena, bread in a mesob), few posed people. Warm, slightly desaturated. One subject per photo.

## What converts on mobile
Sticky bottom bar with two actions: "Book" and WhatsApp/call. Price-from visible before the tap. Tap-to-call and Telegram links. Short enquiry form (4 fields) instead of a booking engine. Reviews and airport distance above the form. Fast first image (hero under ~150 KB, lazy-load the rest).

## Do
1. Show a "from" price per night on every room card.
2. Repeat one booking CTA (header, hero, after rooms, sticky bar) with identical wording.
3. State location in practical terms: minutes from airport/landmark, map link.
4. Use real amenities that matter locally (generator, hot water, Wi-Fi, airport pickup).
5. Lead with one great exterior or view photo and keep hero text under 12 words.

## Don't
1. No auto-rotating hero sliders or video backgrounds (slow, unreadable text).
2. No desktop-style multi-field booking bar squeezed into 360 px.
3. No generic stock of foreign-looking interiors or tourists; no long "welcome" paragraphs before the rooms.

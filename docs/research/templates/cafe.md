# Cafe / coffee house / restaurant: design brief

Method note: pages were read as extracted text (structure, copy, CTAs). CSS was not available, so typography and hex values below are my recommendations informed by these brands' known look, not values scraped from them. Blue Bottle and the Squarespace template gallery could not be fetched (403 / empty).

## Sites opened and what I took
- **Stumptown** (stumptowncoffee.com): full-width hero with one sentence + one button; an origin feature block ("NANO CHALLA", Ethiopia) with flavour notes separated by dots; caps labels.
- **La Cabra** (lacabra.com): quiet hero, then cards with small badges ("Seasonal", "Rare"); a café feature block with an "Open now" label and "Visit us".
- **Onyx Coffee Lab** (onyxcoffeelab.com): alternating white / warm beige / cream bands (#ffffff, #eee9df, #fbfaf3 in source); wide-tracked caps headings; "Come Visit Us" + awards list near the end.
- **Kaldi's Coffee** (kaldiscoffee.com): three action tiles "Order Online / Find Your Cafe / ...": the clearest task split; address + phone in footer.
- **Dishoom** (dishoom.com): hero with native-script caption above the English headline (Hindi "All welcome"): direct model for Amharic + English; two hero buttons "View menus" + "Book a table", repeated after each story block; short heritage story with an archival photo.
- **Tomoca** (tomocacoffee.com): heritage copy first ("have a cup of history"), outlets list; shows what local sites lack: no hours, no CTA, no menu.
- **Delta Cafés** (Awwwards Site of the Day, Nov 2026): numbered slides with one short line each; "since 1961" heritage band; four-step coffee journey (origin, roast, blend, tasting).
- **Framer restaurant category + Qitchen template**: category promise is "menus, opening hours, reservations built in"; menu page = anchor tabs per category, item = name, price, one-line description.

## Hero
Full-bleed warm photo (ceremony, pour, or signature dish), dark gradient at the bottom third. Small eyebrow (area, "since 2010"), 2-5 word headline, one line of subtext, two buttons: primary "See menu", secondary "Call / Order on Telegram". Under the hero, a thin **open-now strip**: "Open today 7:00-21:00 · Bole, Addis Ababa".

## Home page order
1. Header: name left, language switch (EN / አማ), one button (Call).
2. Hero + open-now strip.
3. Signature items: 4 photo cards (name, one line, price in Birr).
4. Menu: category tabs (Coffee, Breakfast, Meals, Pastry, Drinks), rows with name, dotted leader, price; description below in muted text; optional "popular" / "fasting" badge.
5. Story: photo + 3 sentences (ceremony, roasting, family) with one number ("roasting since ...").
6. Gallery: 4-6 photos, mixed crops.
7. Reviews: 2-3 short quotes.
8. Visit: hours table (today highlighted), address, map, phone, Telegram.
9. Footer: hours again, socials, report-abuse link.

## Signature UI
- Menu rows with dotted price leaders, prices right-aligned in tabular numbers ("120 Br").
- Sticky category tab bar inside the menu.
- Hours table with today's row bold and an Open/Closed dot.
- Small pill badges: "Fasting / የጾም", "New", "Popular".
- Round or 4:3 dish thumbnails; a thin woven-pattern (tibeb) divider used once or twice, not everywhere.

## Typography
Display serif with character for headings (e.g. Fraunces, Playfair; for Amharic, Noto Serif Ethiopic), 32-40px on mobile, tight leading (1.15 Latin; 1.35 Ethiopic). Labels in sans caps 12px, letter-spacing 0.12em (Latin only: never track or uppercase Ethiopic). Body sans 16px (Inter / Noto Sans Ethiopic). Prices tabular.

## Palettes
1. **Buna (roast and clay)**: primary #8A4B2A, dark accent #2B1A12, light background #FAF4EA, text #33261F. Optional highlight #D9A441.
2. **Highland green**: primary #1F5A41, dark accent #14261E, light background #F6F1E4, text #26302A. Optional highlight #C8553D.

## Photo style
Warm, low, natural light; shallow depth of field; hands in frame (pouring, roasting, cutting bread). Top-down for plates, 45 degrees for drinks. Dark wood, clay, woven baskets. No stock smiles, no cold blue light.

## What converts on mobile
- Sticky bottom bar with 2-3 actions: Call, Telegram, Directions.
- Menu readable without a PDF and without leaving the page.
- Open-now status above the fold.
- Tap-to-open map; phone numbers as tel: links.
- Images lazy-loaded, hero under ~120 KB at 720px wide.

## Do
1. Show prices in Birr on every item.
2. Put hours and location in three places: under hero, visit section, footer.
3. Lead with one real photo of the house speciality.
4. Keep the menu as live text (searchable, translatable, light).
5. Give Amharic equal visual weight; test long Amharic dish names at 360px.

## Don't
1. No carousels or autoplay video in the hero (slow connections).
2. No PDF or image-only menu.
3. No reservation form as primary CTA: these cafés take calls and Telegram.

# Small shop (fashion, traditional clothes, crafts, general goods): design brief

Method note: pages were read as extracted text (structure, copy, CTAs). CSS was not available, so typography and hex values are my recommendations, not scraped values. Aesop returned 403 and was not read.

## Sites opened and what I took
- **Lemlem** (lemlem.com, Ethiopian-made fashion): hero = one photo, 3-word headline ("Luxury Woven In"), one button; directly below, **three category tiles** with caps labels and "Shop now"; then product grid (name | type, price, colours).
- **Sabahar** (sabahar.com, Addis hand-weaving): "Handcrafted Ethiopian textiles" intro paragraph right after hero; "Browse by collection" (6 image cards); a two-photo block "Our process / Our story"; reviews; "Ethiopia Shop" link for local buyers.
- **Kotn** (kotn.com): alternating rhythm of category tiles and product rows; card = badge (New/Sale), image, name, price; impact numbers as a headline ("25 schools funded. 5,127 farms supported.").
- **Bolé Road Textiles** (boleroadtextiles.com): "Browse our most popular collections" as 4 cards; "As seen in" logo row; About menu split into Story and Process (artisans, craft, materials).
- **AAKS** (aaksonline.com, Ghana baskets): two large lifestyle photos as hero, no headline; card = photo, CAPS name, price, 1-line description, bullet specs (size, material, "handcrafted in Ghana").
- **ZAAF** (zaafcollection.com, Addis leather): eyebrow "Made in Africa" + headline "Built on Heritage." + one button; product rows per category; **"Visit our retail locations"** block with address, phone; reviews with rating.
- **Shopify Dawn and Craft themes**: "product images take center stage"; generous spacing, elegant type, sticky header, image rollover, quick buy; Craft adds storytelling sections.

## Hero
One full-bleed photo (product worn or in use), calm area for text. Eyebrow ("Handwoven in Addis"), 3-5 word headline, one line, two buttons: primary "See products", secondary "Order on Telegram". No slider.

## Home page order
1. Header: name, language switch (EN / አማ), Telegram/Call button.
2. Hero.
3. Category tiles: 3-4 square tiles with label over photo (Dresses, Scarves, Baskets, Leather).
4. Featured products: 2-column grid of cards.
5. How to order: 3 numbered steps (choose, message us on Telegram or call, pay on delivery / pick up).
6. Story / makers: photo of hands at work + 3 sentences + one number.
7. Reviews: 2-3 quotes, or customer photos.
8. Visit: address, map, hours, phone, Telegram.
9. Footer: delivery areas, payment methods accepted, report-abuse link.

## Signature UI
- **Product card**: 4:5 photo, name, price in Birr, optional badge (New / Handmade / Limited), full-width "Order" button that opens Telegram or a call with the product name pre-filled.
- Category tiles with caps label.
- Material / size line under the name ("100% cotton · 2 m").
- "How to order" strip with icons: this replaces the cart.
- Trust row: delivery area, pay on delivery, exchange policy.

## Typography
Two workable characters: (a) refined: display serif headings (Fraunces / Cormorant; Noto Serif Ethiopic), sentence case, 30-36px mobile; (b) modern: geometric sans (Inter / Manrope; Noto Sans Ethiopic), medium weight. Product names 15-16px medium; price same size, bold, tabular. Category labels caps 12px with 0.1em tracking (Latin only; never track Ethiopic). Lots of white space; text never over busy product photos.

## Palettes
1. **Shemma (natural cotton and indigo)**: primary #1F3A5F, dark accent #14202E, light background #FAF7F0, text #2A2A28. Optional highlight #C9A227 (tibeb gold).
2. **Market terracotta**: primary #B4532A, dark accent #3A1F14, light background #FBF3EA, text #2E2420. Optional highlight #2F6B4F.

## Photo style
Products on plain light or natural backgrounds (white wall, wood, raw cotton), soft daylight, consistent crop per grid (all 4:5). One lifestyle shot per category showing the item worn or used by a real person. Detail shots of texture: weave, stitch, fringe. Maker's hands for the story section.

## What converts on mobile
- "Order" on every card going straight to Telegram / phone (deep link with product name).
- Sticky bottom bar: Telegram, Call, Location.
- Price always visible; no "contact for price".
- 2-column grid at 360px with 12px gaps; images lazy-loaded.
- Delivery and payment answer near the first product row.

## Do
1. Show price in Birr and one order button on every product.
2. Keep one aspect ratio for all product photos.
3. Explain ordering in three steps, in both languages.
4. Say where it is made and by whom (one photo, one number).
5. Put shop address, hours and a map on the page: many buyers visit in person.

## Don't
1. No fake cart, checkout or account icons that lead nowhere.
2. No sliders, pop-up discounts or newsletter gates.
3. No text baked into images; no mixed crops in one grid.

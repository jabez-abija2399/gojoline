# Bakery / cake shop / pastry / catering: design brief

Method note: pages were read as extracted text (structure, copy, CTAs) on 2026-11-18. CSS was not available, so typography and hex values are my recommendations, not scraped values. Refused or empty: violetcakes.com and lilyvanilli.com (page body empty), lolascupcakes.co.uk (redirected to lolas.co.uk, not followed up). Searches found no Addis bakery with its own ordering website; the Addis examples below are a delivery-platform shop page and a small template-built bakery site.

## Sites opened and what I took
- **Tartine** (tartinebakery.com, San Francisco): announcement bar used for the season ("Click here to pre-order your holiday pastry and pies"); hero "Welcome to Tartine" + one sentence; location buttons with counts ("Bay Area, 4 locations"); a **"Special order cakes"** block that states the rule plainly ("special order cakes require a seven day lead time"); an "Ordering for" picker (Bay Area / LA) before the order link; pickup address named on the pre-order block.
- **Magnolia Bakery** (magnoliabakery.com): every product card carries a **fulfilment tag** ("ASAP Delivery & Pick Up", "Catering Delivery", "Advanced Pick Up", "Nationwide Shipping"); local notice "only accepting advance orders via phone or e-mail" with "Call Bakery" / "Email Bakery" buttons; holiday block "Your Thanksgiving dessert lineup is here!" + "Order now" / "Menu"; story "It all started in 1996".
- **Milk Bar** (milkbarstore.com): top bar deadline "Order by 11/22 for Thanksgiving!"; hero "Cross pie off your list"; **sizes as separate products with prices** ("6" Birthday Cake $65", "10" Birthday Cake $140"); occasion row "Birthdays · Thank you · Congrats"; "Send group gifts" (one order to many addresses); "Word on the street" press quotes.
- **Konditor** (konditor.co.uk, London): top bar "Freshly baked, every day · Next Day London Delivery" + phone; menu shops by product, by **occasion** and by **delivery type**; cards "Rainbow Happy Birthday Cake, From: £66.00, 6 Flavours", badges "Bestseller", "Wheat Free"; **"Add a Gift Message Card" with a 0/120 character counter**; basket choice "Nationwide Delivery / London Delivery / Collect".
- **Peggy Porschen** (peggyporschen.com, London): seasonal hero ("Step into a Gingerbread Fairytale") with a press quote above it ("Probably the best cupcakes in the world!"); festive cake collection, "Cakes for sharing", gift cards; "Visit us" with address and full weekly hours; whimsical, pink, "packed with prettiness" tone.
- **Edels Bakes order form** (Jotform): the cleanest cake-order model. First choice Celebration vs Wedding; then **date for collection/delivery**, **collection time slot** (two fixed slots + "Not sure"), **size with portions and price on one line** ("6" round, 20-25 portions, €90"), flavour list (surcharges inline), colour/theme, **inscription** (optional), inspiration photo upload; wedding branch adds venue, guest count, tiers with servings. Terms: 50% deposit secures the date, balance before collection, allergies at booking.
- **The Bake Shop on Deliver Addis** (deliveraddis.com, Ayat, Addis Ababa): menu by Cookies (per ½ kg) / Muffins (12-count) / Cupcakes (12-count) / Cakes, prices in ETB ("Chocolate 825.00", "Carrot Cake with Cream Frosting 1,299.99"); **fasting options inside the same item** ("Coffee, regular or fasting"); "pre-orders only … delivered the next day after 10 AM"; occasion cakes with special requests priced on request; gluten-free teff items. This is how Addis buyers already order baked goods.
- **Sarania Cafe & Bakery** (sarania.wegic.app, Addis Ababa): AI-builder site; hero "Delightful Treats for Every Occasion" with hours in the body copy; sections Signature Delights → Gallery → Visit Us → testimonial → Instagram. No prices, no ordering method, placeholder phone and leftover editor text: what Gojoline must not produce.
- **abcFlora Ethiopia** (abcflora.com/collections/ethiopia, gifts sent from abroad): the diaspora pattern. "Next-day delivery in Ethiopia", "Hand-delivered by a local florist", flat delivery fee, a "Chocolate Cake for Ethiopia" card in USD; "Choose the date in the cart"; **closed dates listed** (7 Jan, 19 Jan, 11 Sep, 27 Sep …: Genna, Timkat, Enkutatash, Meskel) with "order a day early"; gift message "exactly as you write it, in any language".

## Hero pattern
One close, warm photo of the signature cake or the morning bread (square or 4:5 on mobile, text under it). Eyebrow with area and promise ("Bole · Baked fresh every morning"), 3-6 word headline ("Cakes for every celebration"), one line with the rule that matters most ("Order 2 days ahead · pickup or Addis delivery"), two buttons: primary "Order a cake", secondary "Today's menu". Above the header, when a holiday is near, an **order-by bar**: "Genna cakes: order by ታኅሣሥ 26 / 4 January" (Milk Bar, Tartine pattern). Below the hero an open-now strip as in `cafe.md`.

## Home page order
1. Order-by bar (only in holiday windows) and header: name, EN / አማ, Telegram button.
2. Hero + open-now strip ("Open today 6:30-20:00 · Bole").
3. Ways to get it: three tiles "Pick up", "Addis delivery", "Send to family in Ethiopia" (Magnolia/Konditor fulfilment split; the third is for the diaspora).
4. Cake gallery: 2-column grid filtered by occasion chips (Birthday, Wedding, Holiday, Fasting, Kids).
5. Sizes and prices: one small table (size, serves, price from), so nobody has to ask.
6. Holiday specials: a card per upcoming holiday with dates in both calendars, products and order-by date.
7. Daily menu: bread, pastries, cookies as rows with price per piece / per kg / per dozen; fasting badge.
8. Catering: platters and trays for events with "serves 20 / 50 / 100", one line on lead time, "Ask for a quote".
9. How to order: 3 steps (choose → send the order form or Telegram → pay deposit by Telebirr/bank, pick up or receive).
10. Reviews / customer photos with the occasion ("Birthday, Jemo").
11. Visit: hours table, address, map, phone.
12. Footer: delivery areas and fees, payment methods, allergen note, report-abuse link.

## Pages
- **Home** (above).
- **Cakes**: gallery with occasion chips; card opens a sheet with sizes, flavours, price, lead time and "Order this cake".
- **Order a cake**: the form (below).
- **Menu**: daily bakery items by category with sticky tabs (Bread, Pastry, Cookies, Cakes by slice, Drinks).
- **Holidays**: current and next specials, closed days.
- **Catering**: trays, buffets, coffee-ceremony packages, quote form.
- **Send a cake to family**: diaspora page (below).
- **Visit**.

## Signature UI
- **Cake order form** (single page, one field per row): occasion; date (calendar that blocks dates inside the lead time and closed holidays) and time slot (morning / afternoon); size as chips showing serves + price ("20 cm · 12-15 people · 1,800 Br"); flavour; fasting (vegan) yes/no; **message on cake with a live counter** (30 characters, Konditor/Edels) and a script choice (Amharic / English); colour or theme; inspiration photo (optional, compressed on device); pickup or delivery with area; name and phone. On send: an order summary card plus "Order sent to [shop] on Telegram. You will get a reply with the deposit details."
- **Size table**: size, serves, price from; tabular numbers.
- **Fulfilment tags** on cards: "Pick up", "Addis delivery", "Order 2 days ahead", "Today".
- **Fasting / የጾም badge** and in-item fasting choice (Deliver Addis pattern); allergen line (nuts, gluten, dairy).
- **Holiday card**: name in Amharic and English, Ethiopian + Gregorian date, 2-4 products, order-by date, closed days.
- **Order-by bar** at the top in holiday windows; disappears after the date.

## Ethiopian holiday calendar (owner edits each year)
- **Genna** (Christmas, 7 Jan / ታኅሣሥ 29) ends the 43-day Advent fast (Tsome Nebiyat, from 25 Nov): demand for non-fasting cakes jumps; offer fasting cakes before, rich ones for the day.
- **Timkat** (19 Jan / ጥር 11): family gatherings, platters, bread (dabo) for the feast.
- **Fasika** (Easter, moveable; 2 May 2027) ends the 55-day Lent fast (Hudade): fasting range for weeks, then the biggest cake and dabo day of the year.
- **Enkutatash** (New Year, 11 Sep, 12 Sep before a Gregorian leap year): gifts, cakes with "መልካም አዲስ ዓመት".
- **Eid al-Fitr and Eid al-Adha** (moveable; approx. 10 Mar and 17 May 2027): cookie boxes, trays, "Eid Mubarak / ዒድ ሙባረክ" messages; Ramadan evening (iftar) pastry trays.
- Also Meskel (27 Sep), weddings (high season after Timkat and after Fasika), graduations (June-July), baptisms (kirstina).
Moveable dates (Fasika, Eids) must be entered by the owner, not computed silently; the site shows the closed days too (abcFlora lists them).

## Diaspora ordering ("send a cake to family")
- Separate page and home tile: "Send a cake to your family in Addis".
- Form adds recipient name, recipient phone, neighbourhood + landmark (Addis addresses are landmark-based), delivery date and window, message on the cake and a gift note "in any language" (abcFlora).
- Price shown in Birr with the delivery fee; the owner may add a fixed USD/EUR price for the diaspora instead of a live conversion.
- Payment without cards: bank transfer from abroad to the shop's account, or a relative pays by Telebirr in Ethiopia; the confirmation says which.
- Promise a photo of the cake at delivery, sent to the buyer on Telegram.
- State the time zone of delivery slots (East Africa Time) next to the date picker.

## Typography
Warm and a little soft. Headings in a rounded or soft serif (Fraunces with the SOFT axis, or Recoleta-like alternatives such as "Young Serif"; for Amharic, Noto Serif Ethiopic semibold), 32-38px at 360px, 52-60px desktop, leading 1.15 Latin / 1.35 Ethiopic. Body and form labels in a friendly sans (Nunito Sans or Inter; Noto Sans Ethiopic) 16px. Prices, sizes and dates tabular. Chips and badges 13px medium, no tracking on Ethiopic. Script lettering only in the logo, never for menu or prices.

## Palettes
1. **Butter and berry (cake studio)**: primary #B23A5B, dark accent #3D1A24, light background #FFF8F2, text #33232A. Optional highlight #F2C14E for holiday and "Today" tags.
2. **Crust (bread, pastry, catering)**: primary #A0582A, dark accent #2E1C12, light background #FBF5EC, text #2F2620. Optional highlight #5E7D4E for the fasting badge.
Keep the fasting badge one consistent green across palettes so regular customers learn it.

## Photo style
Close, warm, natural light from the side; cakes at a 30-45 degree angle showing height and layers, plus one cut slice; bread and pastries in baskets or on trays from above. Real shop counters and the oven at dawn for the story. Same background per gallery (wood, linen, plain cream). Show the real message piped on a cake so buyers see the lettering quality. No stock cupcakes, no cold white studio light, no heavy filters that change icing colours.

## Amharic notes
- Common phrases buyers write on cakes: "መልካም ልደት" (happy birthday), "እንኳን ደስ አለሽ/አለህ" (congratulations, gendered), "መልካም አዲስ ዓመት", "እንኳን ለብርሃነ ልደቱ አደረሳችሁ" (Genna greeting: long, so offer it as a suggestion that fits). The counter must count Ethiopic characters correctly (grapheme count, not bytes).
- Date picker shows Ethiopian date alongside Gregorian on the chosen day.
- "Fasting" = የጾም; "serves 12" = "ለ12 ሰው".

## What converts on mobile
- Sticky bottom bar: Order cake, Telegram, Call.
- Sizes, serves and prices visible before the form, not after a chat.
- Lead time stated next to every cake and blocked in the date picker.
- Form survives a dropped connection (draft kept in localStorage) and posts small: photo compressed under ~300 KB before upload.
- Hours, today's open status and map within two screens.
- Gallery images 720px wide under ~100 KB, lazy-loaded; no autoplay video.

## Do
1. Show sizes, serves and prices in Birr in one table.
2. State the lead time and the pickup/delivery choice on every cake.
3. Put the next holiday, its order-by date and closed days on the home page.
4. Mark fasting cakes and allergens clearly.
5. Give the diaspora its own path: recipient details, landmark address, photo on delivery.

## Don't
1. No "contact for price" galleries and no Instagram-only menus (the Sarania gap).
2. No card checkout or fake cart; the order goes to Telegram and the deposit by Telebirr/bank transfer.
3. No free-text date field (people type "next Sunday"), no unlimited message length, no carousel hero.

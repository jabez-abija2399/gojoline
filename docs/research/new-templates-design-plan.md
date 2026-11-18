# Design plan for the next eight templates (2026-11-18)

What the next templates should look like, and what the template system needs to make them. Built on
`new-templates-2026-11.md` (which templates and why), the eight content briefs in
`docs/research/templates/`, a visual study of the best-selling and awarded templates per niche
(Framer, Webflow, ThemeForest, Squarespace, Awwwards; sources at the end) and our own constraints:
Amharic and English, cheap Android phones in sunlight, slow and expensive data, owners who edit by
chatting.

## 1. Where we start

The 14 templates we have all share one mood: a cream background (#F0–#FB), earthy brown, green or
navy, and one of five heading fonts (Fraunces, Outfit, Nunito, Cormorant, Bricolage). Nothing is
dark, bright, pastel or condensed. A gallery of 22 like that would look like one template in 22
colours. The new eight should widen the range on purpose while keeping what already works (real
photos, real prices, Telegram as the way to order, fast pages).

## 2. Principles for all eight

1. **Light pages, dark bands.** Research on reading (NN/g) favours light pages for small text and
   older readers, and cheap LCD phones wash out dark greys in sunlight. Dark is used where the niche
   expects drama (gym, garage, construction) as full-width bands: the hero, one feature strip, the
   closing call and the footer, always with large bold text.
2. **One accent colour that is a fill, never text.** Each template has a bright accent (safety
   yellow, Meskel yellow, volt, amber, tibeb gold) used behind ink text, on rules and badges. All
   pairs below are checked: body text 15:1 or more, links 4.8:1 or more, white on the main colour
   5.3:1 or more, ink on the accent 6:1 or more.
3. **Prices are the hero of the page.** Every niche sells on a clear number: tabular figures, Birr
   first, a unit ("per quintal", "per day with driver", "serves 12", "per month"), and "from" when it
   varies.
4. **Amharic is designed, not translated.** Never uppercase or letter-space Ge'ez; contrast comes
   from weight. Line height 1.35 or more. Where Latin headings are condensed, Amharic headings use
   Noto Sans Ethiopic's narrow width (its variable font goes down to 62.5%) at weight 700–800, so
   both languages share a look.
5. **Telegram is the checkout.** Every catalogue card and package has "Order on Telegram" (or the
   form), because that is where Ethiopian buyers already are. No file uploads on the site:
   prescriptions, artwork and measurement photos go through Telegram, so the site never stores
   health data or large files.
6. **Motion stays cheap.** CSS only, transform and opacity, stops under reduced motion: marquees,
   scroll reveals, a rotating sticker, one hero entrance. No video heroes, WebGL, custom cursors or
   smooth-scroll libraries (all common on award sites, all wrong for our visitors).

## 3. What the template system needs (build these first, once)

| # | Addition | Used by | Notes |
| --- | --- | --- | --- |
| 1 | **Dark bands**: `tone: "dark"` on hero, cta, services, menu and cards sections | Gym, garage, construction, studio | Cards on a dark band use a dark surface; contrast rules check both. Stats and marquee already have `tone` |
| 2 | **Condensed heading font** `condensed`: Archivo, variable width (Latin) | Construction, garage, gym | One file (~40 KB, measure); width 75 for gym and construction, 87.5 for garage |
| 3 | **Ethiopic font with width and weight 800**: rebuild the subset keeping `wdth` 62.5–100 and `wght` 400–800 | All condensed templates; bolder Amharic everywhere | Today's file is 80 KB at 400–700; measure the new size, keep it under ~110 KB or ship two instances |
| 4 | **Editorial serif** `editorial`: Newsreader (Latin) | Studio | The other serifs are taken by café, shop, worship (Fraunces) and hotel, events, salon (Cormorant) |
| 5 | **Pricing tiers**: `cards` layout `pricing` (2–4 tiers, one marked "Most chosen", list of what is included, one button each) | Gym, studio, training, garage rental | Today tiers are plain cards |
| 6 | **Weekly timetable**: `schedule` layout `week` (days across, times down on large screens; one day at a time with day chips on phones; badges such as "Women only") | Gym, training | Today's schedule is a list or tiles of one day |
| 7 | **Price table with units**: `menu` layout `table` (name, grade/spec, unit, price, in-stock dot; tabular figures) and an optional `unit` on prices | Construction, garage services, pharmacy services | Menu items today have no unit |
| 8 | **Motifs** (`theme.motif`, locked CSS, under 2 KB each): `tibeb` woven band divider, `hazard` stripe rule, `highlight` marker swipe behind one word, `sticker` round rotating badge, `polaroid` tilted photo stack, `route` numbered progress line | One per template (below) | Decoration only, `aria-hidden`; all respect reduced motion |
| 9 | **Open-now pill**: "Open now · closes 21:00" / "On duty tonight", from the hours the owner set | Pharmacy, garage, gym, bakery | A few lines of script that runs after load; static text without script |
| 10 | **Option chips on cards** (sizes, cake sizes, seats): shown from the existing `meta` list as chips | Fashion, bakery, garage fleet | Mostly CSS |

Each is additive and optional, so the 14 existing sites are unchanged. Effort: about 2 days for the
system additions, then about 1 day per template (English and Amharic content, ~10 licensed photos,
presets, screenshots, review).

## 4. The eight designs

Fonts are heading / body. All bodies use the system font stack in Latin and Noto Sans Ethiopic in
Amharic, as today.

### Fashion: "Kemis editorial"
- **Mood:** a fashion magazine with a woven border. Cream reads as cotton kemis, gold as the tibeb
  thread, wine as a church dress. References: Lemlem, LUXÉ, Toast, Prestige.
- **Palette:** background #FAF6EF · text #1E1714 · primary wine #7A2333 · accent tibeb gold #C9A227
  (fill and rules only) · surface #F1E9DC.
- **Type and shape:** `elegant` (Cormorant) / body; radius none; motif `tibeb`.
- **Hero:** `portrait`, a 4:5 full-length photo in daylight beside "Kemis for Timkat, made to fit";
  buttons "See dresses" and "Order made to measure"; promise strip under it ("Made to your
  measurements · Addis delivery in 1–2 days · We ship worldwide").
- **Home:** hero → marquee of promises → occasion tiles (Wedding, Church and holiday, Everyday,
  Men and couples) → featured pieces (2-column cards, price, size chips, "Order on Telegram") →
  made-to-measure steps (choose, send measurements, we sew and send photos, collect or ship) →
  next-holiday banner ("Order by 20 December for Genna") → craft story with the loom → customer
  photos with city ("Hanna, Washington DC") → delivery and payment → visit and fittings.
- **Pages:** Home, Collection, Made to measure, Visit.
- **Avoid:** pure white (white dresses vanish), sale-badge clutter, gold text.

### Bakery: "Butter and Meskel"
- **Mood:** warm, celebratory, a little playful: arch-shaped photos, a round sticker, Meskel-daisy
  yellow. References: Mallow, Milk Bar, Magnolia, Peggy Porschen.
- **Palette:** background #FFF8F0 · text #2E1D17 · primary berry #A3324B · accent Meskel yellow
  #F2C14E (fill) · surface #FBE6DA.
- **Type and shape:** `classic` (Fraunces, soft) / body; radius large, arch tops on photos (exists);
  motif `sticker` ("Order 2 days ahead").
- **Hero:** `split`, a cake photo in an arch, "Cakes for every celebration", buttons "Order a cake"
  and "See today's bakes".
- **Home:** hero → today's bakes (menu with photos) → celebration cakes (cards with size chips:
  "20 cm · 12 people · 1,800 Br") → how to order (steps: choose, pick a date, we confirm on
  Telegram, collect or delivered) → holiday specials (Genna, Fasika, Enkutatash, Eid) with order-by
  dates → order form (date, size, flavour, message on the cake) → for family abroad ("Order from
  abroad, we deliver in Addis") → visit, hours with open-now pill.
- **Pages:** Home, Cakes, Order, Visit.
- **Avoid:** heavy motion (cursor trails, draggable sliders), script fonts in body text.

### Construction: "Concrete and safety yellow"
- **Mood:** a serious yard: light concrete pages, charcoal bands, a thin yellow-and-black hazard
  stripe, oversized numbers. References: Constructionn, BrickYard, Skanska, Q-Industrial (Awwwards).
- **Palette:** background #F4F2ED · text #17191C · primary rust #B8461B · accent safety yellow
  #F5B800 (fill) · surface #FFFFFF · dark band #1F2328.
- **Type and shape:** `condensed` (Archivo, width 75, weight 800) / body; radius 2 px; motif
  `hazard`.
- **Hero:** dark band, condensed headline "Cement, steel and finishing, delivered", facts row
  (years, projects, delivery areas), buttons "Get a price" and "Today's prices".
- **Home:** hero → today's prices (menu `table`: product, grade, unit, Birr, in stock) → categories
  (cards: cement, steel, aluminium, tiles, paint) → stats (tonnes delivered, projects, trucks) →
  projects (cards with place and size) → delivery areas → quote form (product, quantity, site
  location, date) → licences and grade (contractor grade, TIN, licence number).
- **Pages:** Home, Products and prices, Projects, Contact.
- **Avoid:** full-black pages, gold luxury, yellow text, parallax.

### Garage and car rental: "Workshop red"
- **Mood:** a clean, trustworthy workshop with one dark band: signal red, amber for open now and
  warranty. Works for a garage, a rental company, or both. References: CarRepair, RevX, Carlux,
  Jetti.
- **Palette:** background #F3F4F6 · text #111418 · primary red #C4161C · accent amber #FFB000
  (fill) · surface #FFFFFF · dark band #16191E.
- **Type and shape:** `condensed` (Archivo, width 87.5) / body; radius 6 px; motif none; open-now
  pill.
- **Hero:** dark band with a car in a clean bay, "Honest repairs. Fixed prices." (garage) or "Cars
  with driver, from the airport to anywhere" (rental); booking button.
- **Home:** hero → service price board (menu `table`) or fleet (cards: photo side-on, seats,
  gearbox, "with driver", price per day as chips) → how it works (book, drop off or get picked up,
  we call with the price before work, collect) → warranty and trust (stats) → booking form (car
  make, model, plate, service or dates, airport pickup) → reviews → map and hours.
- **Pages:** Home, Services or Fleet, Book, Visit.
- **Avoid:** all-black pages, chrome gradients, video.

### Wedding and event studio: "Ivory and bronze"
- **Mood:** an editorial print magazine: ivory, bronze, big couple names in a serif, the photos
  carrying the colour (habesha white, gold, green). Gallery pages turn dark so photos glow.
  References: Everlune, Vowline, Beaumont, Aoki.
- **Palette:** background #F5F0E8 · text #1A1714 · primary bronze #8C5528 · accent thread gold
  #B08D57 (rules and chips) · surface #EAE2D5 · gallery band #14110F.
- **Type and shape:** `editorial` (Newsreader) / body; radius none on photos, pills on chips;
  motif `polaroid` (latest weddings).
- **Hero:** `immersive` full-bleed photo, couple names large ("Selam & Dawit"), "Bahir Dar · Ter
  2026" small, button "Is my date free?".
- **Home:** hero → latest weddings (polaroid stack, then a gallery `wall` on a dark band) →
  packages (cards `pricing`: Melse, Wedding day, Full story; "from" prices, what is included) →
  how we work (steps) → couples' words → date-availability form (date, place, guests, package) →
  for couples abroad → questions.
- **Pages:** Home, Weddings (gallery), Packages, Book.
- **Avoid:** autoplay video, script fonts for Amharic names, heavy lightboxes.

### Training centre: "Route to the certificate"
- **Mood:** clear and confident: trust blue, a yellow marker swipe behind one word, a numbered route
  from first class to certificate (or licence, for driving schools). References: Bright Path,
  Clutch, ProLingo, Drivora.
- **Palette:** background #FAF9F6 · text #17172B · primary blue #2445C8 · accent marker yellow
  #FFC83D (fill) · surface #FFFFFF.
- **Type and shape:** `grotesk` (Bricolage) / body; radius 12 px; motif `highlight` and `route`.
- **Hero:** `split`, a real classroom photo, "Pass your national exam with confidence", the next
  intake date as a big block ("Next class 5 January"), buttons "Register" and "See courses".
- **Home:** hero → courses (cards: duration, fee, next intake as a date block) → the route (steps:
  placement, classes, practice tests, exam, certificate) → timetable (schedule `week`) → results
  (stats: pass rate, students, years) → teachers (cards `people`) → registration form → questions
  (fees, payment in instalments, certificates).
- **Pages:** Home, Courses, Timetable, Register.
- **Avoid:** dark pages (people read here longer), cartoon illustrations, graduation-cap clipart.

### Pharmacy: "Bottle green"
- **Mood:** the trusted neighbourhood pharmacy (ፋርማሲ) rather than a hospital: ivory-green, bottle
  green, an amber "on duty" sign. References: Dispensary, Pestle, Capsule.
- **Palette:** background #F6FAF7 · text #10201A · primary #12703B · accent on-duty amber #F4B731
  (fill) · surface #FFFFFF.
- **Type and shape:** `modern` (Outfit) / body, no serif (older readers); radius 8 px; open-now
  pill above the fold.
- **Hero:** `split`, a photo of the real counter and pharmacist, status pill "Open now · closes
  22:00" or "On duty tonight", buttons "Ask if it's in stock" and "Call".
- **Home:** hero → services (blood pressure, sugar test, advice, home delivery; services list with
  prices where allowed) → ask the pharmacist (form: what you need, phone; prescriptions only by
  Telegram) → health products that are not medicines (cards) → hours and night duty → our
  pharmacist (name, licence) → map.
- **Rules:** no medicine names, brands or prices anywhere (Proclamation 1112/2019, Art. 59); EFDA
  licence number, outlet type and responsible pharmacist shown; no red cross (a protected emblem).
- **Pages:** Home, Services, Ask us, Visit.
- **Avoid:** pill stock photos, scroll-pinned animation, glassy effects.

### Gym: "Volt"
- **Mood:** energy without the cost of a dark page: a dark hero and one dark "free session" strip
  with volt-yellow, the timetable and prices on light pages, condensed type, oversized numerals.
  References: Pulse, Progym (has an Arabic version), Gymbox and Essor (Awwwards).
- **Palette:** background #F2F2EE · text #111111 · primary ember #C62E17 · accent volt #D4FF3A
  (only on dark or behind black text) · surface #FFFFFF · dark band #121212.
- **Type and shape:** `condensed` (Archivo, width 75, uppercase in Latin only) / body; radius 4 px;
  motif none; marquee of class names.
- **Hero:** dark band, a real member mid-movement, "Stronger every week" with "01 Lift · 02 Box ·
  03 Dance" numerals, buttons "Book a free session" and "See prices".
- **Home:** hero → marquee of classes → memberships (cards `pricing`: monthly, 3 months, yearly;
  women-only hours noted) → timetable (schedule `week`, "Women only" badges) → trainers (cards
  `people`) → free-session strip (dark, volt button) → facilities (gallery) → results and reviews →
  map, hours with open-now pill.
- **Pages:** Home, Classes, Prices, Visit.
- **Avoid:** full-dark pages, glow and canvas effects, outlined type in Amharic, autoplay video.

## 5. Photos

Each template needs about 10 licensed photos (Unsplash or Pexels, as in the existing library):
4:5 portraits for fashion and gym, side-on cars at one angle for the fleet, warm side light for
cakes, real counters and yards rather than generic stock. Prefer photos of African and Ethiopian
people and places; record source and photographer in `stock.json` as today.

## 6. Build order

1. System additions 1–3 (dark bands, condensed font, Ethiopic width), then 5–7 (pricing, week
   timetable, price table), then 8–10 (motifs, open-now pill, chips).
2. Templates in the order of the evidence: fashion, construction, garage, bakery, studio, training,
   pharmacy, gym; each with English and Amharic content, photos, screenshots and a design review.
3. Template gallery grouped by industry once there are 22.

## 7. What Awwwards adds (founder's request: awwwards.com/websites)

The gallery and its category filters (fashion, food and drink, architecture, photography, sports,
education, automotive) for 2025–2026, each site's Awwwards page read for palette, technologies and
award. Font names are not shown on those pages.

**The main finding:** Sites of the Day are mostly WebGL, Three.js and smooth-scroll libraries, which
we can't use. But the Honorable Mentions in our niches are often plain Shopify, Webflow, WordPress,
Framer or Tilda sites that win on photography, type and restraint. That level is reachable with our
locked HTML and CSS template.

Examples per niche: Almada Label and Deadly Ponies (fashion; warm off-white #F7F5F0 and near-black,
photos at full size, a shop laid out like a magazine); Theobroma (#FFF4E3 cream and #2F1B12 cocoa)
and Impasto Forno Antico (bakery, a layered footer); Avagyan, Tatiana Braoun, Almira Kho (wedding
photography: black and white, full-screen galleries; one built with Tilda); Namaha Healthcare (warm
clay instead of clinical blue) and Phamily (pharmacy, bottle green #09543D); BCG Building Design
(#f6f5f0 and #3a3027, a stacked process section); Semler Premium (automotive, big photos, no
WebGL); Bettr Academy (education, loud #FCBF27 yellow used to guide the eye through a dense course
catalogue); Core Atelier Pilates (#F7E7DE and #25140C, a simple booking path) and Fighter Ready
(near-black with one hot accent).

**Patterns that recur and that we will use:**

1. Two-colour palettes: a warm off-white and a warm near-black, plus at most one loud accent. This
   matches principle 2 and confirms the palettes above.
2. Type-led layouts: large display headings with small labels.
3. Full-bleed photos with a gradient scrim for text; never video.
4. Sticky stacking cards for a process ("how it works", "your route"), with `position: sticky`.
5. Image reveals with `clip-path` driven by scroll (`animation-timeline: view()`), only where
   supported and never under reduced motion.
6. Editorial, asymmetric galleries (CSS grid, some items spanning two columns) for fashion, weddings
   and cakes.
7. A marquee strip of classes, promises or products (gym, bakery, fashion).
8. Cross-page view transitions (`@view-transition { navigation: auto }`) so moving between pages
   feels like one app, at no script cost.
9. The footer as a feature: dark, large business name, contact, map link and hours.
10. A faint paper or grain texture (an inline SVG under 1 KB) for bakery and wedding.

**Not used:** page loaders (they slow a slow connection), WebGL and 3D, custom cursors,
smooth-scroll libraries, video heroes.

**Non-Latin scripts:** award winners rarely handle them. The best example was a bilingual
Japanese and English wedding site that pairs labels in both languages (日程 / Schedule) and keeps
the dramatic display type in Latin and numbers while setting the native script calmly. For Amharic
that means: Ge'ez body text at 17 px or more with line height 1.6, no letter spacing, no uppercase,
`:lang(am)` overrides, and every large heading size tested with Amharic, which runs longer.

These are folded into the system additions: items 4–6 and 8–10 above become part of the locked
`motion.css` and `design.css`, available to every template, old and new.

## Visual board

Phone mock-ups of all eight home pages, with colours and type: a private Design canvas in the
founder's claude.ai account (link in the conversation). Photos there are labelled placeholders that
say what each photo must show.

## Sources

Content briefs: `docs/research/templates/{fashion,bakery,construction,garage,studio,training,pharmacy,gym}.md`.
Visual references: framer.com/marketplace (LUXÉ, Foldora, Mallow, Cakelab, Everlune, Vowline, Aeternum,
Dispensary, Pestle, Ampul, Constructionn, Meridian co, Build Co, CarRepair, RevX, Crafter, ByDrive,
Clutch, Bright Path, ProLingo, Pulse, Fitnex, Progym, ONFIT) · webflow.com/templates (Ovenly,
BrickYard, Basegrid, Carlux, Jetti, Drivora, Liftline) · themeforest.net (StructurePress, AutoXpert)
· squarespace.com (Beaumont, Sophie) · awwwards.com/websites and the site pages named above ·
nngroup.com/articles/dark-mode · fonts.googleapis.com (axis and subset checks).

# Gojoline site template: guide for the builder agent

Every Gojoline site is this Vite + React + Tailwind project. **Every change is an edit to `src/site.json`** (or, rarely, extra CSS in `src/styles.css`). The page structure, theme, texts, prices and contact details all live in that JSON file, whose shape is `Site` in `src/lib/types.ts`. Keep it valid JSON (double quotes, no comments, no trailing commas).

## Files

| File | Purpose | Edit? |
| --- | --- | --- |
| `src/site.json` | All content: name, languages, theme, business details, pages and their sections | Yes, this is the main file |
| `src/site.ts` | Loads site.json with its type | No |
| `src/lib/types.ts` | The content model (`Site`, `Page`, `Section`, `Text`, `Price`) | Read only |
| `src/sections/*.tsx` | Section components (Hero, About, Cards, Menu, Services, Gallery, Stats, Steps, Schedule, Quote, Contact, MapEmbed, Testimonials, Timeline, Faq, Cta, Form, Header, Footer) | No (read them to see what each field does) |
| `src/design.css`, `src/motion.css`, `src/grand.css`, `src/avant.css`, `src/precise.css`, `src/monochrome.css`, `src/drafting.css`, `src/noir.css`, `src/folio.css` | The site styles and motion (the style files are only built into sites with that `theme.style`) | No |
| `src/styles.css` | Tailwind setup, theme utilities, `.btn`, `.section`, `.container-site` | Rarely, for small style tweaks |
| `public/images/` | Photos the owner uploaded | Reference them as `/images/<name>` |
| `/stock/<name>.webp` | Sample photos from Gojoline's library (see Sample photos below) | Reference only; you can't add to it |

## Content rules

- `Text` is `{ en?: string; am?: string }`. Fill **every language listed in `site.languages`**. Amharic must be natural Amharic in Ge'ez script, not transliteration.
- The first language in `languages` is the default (served at `/`); the second is served under `/am/...` or `/en/...`.
- Money: `price: { amountMinor: 15000, currency: "ETB" }` means 150 Birr. Integers only, never floats.
- Page `path`: `"/"` for home, otherwise lowercase like `"/menu"`. Add `nav` to show a page in the navigation.
- Links (`href`): `"#contact"`, `"/menu"`, `"tel:+251911234567"`, `"mailto:..."` or `https://...`. Nothing else is allowed.
- Images: use the owner's photos when there are any. Without one, use a sample photo from the library that truly fits (see Sample photos below), and tell the owner once, in your reply, that the pictures are samples to replace with their own. Where no sample fits, omit `src` and set `art` to a drawing (see Drawings below). Never use a sample photo to show something specific to this business that it doesn't show (their building, their staff by name, their products): use a drawing there. Always write a short, specific `alt` in each language that describes what is in the picture.
- A site started from a template holds example reviews, quotes, staff and numbers. When the owner tells you about their real business, replace these with what they gave, or remove those sections (`testimonials`, a `quote` with a name, `cards` with `layout: "people"`, `stats`, and a studio's sample projects and clients in its work `cards`); never leave or adapt the examples as if they were real. A site can't be published while a template's reviews, people or numbers are still in it, while a `portrait` hero shows a sample photo (it would stand for the owner: use their photo or leave `src` out for a drawing), or while a named person is shown with a sample photo (use the owner's photo, or no picture: a `people` card without `image` shows a drawing).
- Never invent facts the owner did not give (prices, phone numbers, addresses, awards). Leave the field out instead; ask the owner if it matters.
- Never use lorem ipsum. Write short, warm, concrete copy for the business.
- The first section of the home page should be a `hero`; it becomes the page's only `<h1>`.

## Sections

| `type` | Use for | Key fields |
| --- | --- | --- |
| `hero` | Top of a page | `variant` (`split`, `centered`, `banner`, `immersive`, `portrait`, `poster`, `bento`), `eyebrow`, `heading`, `subheading`, `image`, `primaryAction`, `secondaryAction`, `facts[]` (up to 4 `value` + `label`, only facts the owner gave; numbers count up), `stamp` (a few words on a turning circle), `frame` (immersive: the photo opens out from a rounded frame), `hours` (split: `false` hides the opening hours beside the picture) |
| `about` | Story, mission, a feature with a picture | `eyebrow`, `heading`, `body` (blank line = new paragraph), `image`, `imageSide` (`start`, `end`), `imageShape` (`arch`), `points[]` (a ticked list), `highlights[]` (`value`, `label`), `action` |
| `cards` | Anything shown as picture cards: rooms, properties, tours, products, dishes, team, projects, programmes | `layout` (`grid`, `feature`, `scroll`, `people`, `stack`, `index`, `pricing`), `imageShape` (`arch`), `filters`, `items[]` (`image`, `title`, `subtitle`, `description`, `price`, `priceNote`, `badge`, `meta[]`, `action`), `action`, `tone` (`dark`: on a dark band) |
| `menu` | Food, drinks, price lists | `categories[]` with `items[]` (`name`, `description`, `price`, `unit` (what the price is for: "per quintal", "per m²", "per day"), `tag`, `image` for a few signature items), `layout` (`list` cards with dotted leaders for food; `table`: one price table with units and tags in columns, for materials, parts and services), `tone` (`dark`) |
| `services` | What you offer, without pictures: treatments, amenities, departments, reasons to choose you | `variant` (`bento` cards, `list` compact rows, `numbered` 01 02 03), `image` (with `list` or `numbered`: a photo that stays beside the list as it scrolls), `items[]` (`title`, `description`, `price`, `icon`) |
| `stats` | A band of 2 to 4 big numbers (years, guests, students, homes sold). Only numbers the owner gave | `items[]` (`value`, `label`), `tone` (`dark`, `soft`), `heading` |
| `steps` | How it works, in order: booking, admissions, ordering | `items[]` (`title`, `description`), `action` |
| `schedule` | Times: service times, prayer times, class times, an event programme, term dates. With `at` on items, the next one is highlighted with a countdown; `dates` shows today's date in Gregorian, Ethiopian and/or Hijri | `layout` (`list`, `tiles`, `week`: one column per `day`, for classes and timetables, up to 40 items), `items[]` (`time`, `title`, `note`, `at` as "HH:MM" 24 h, `day` with `week`), `dates` (`gregorian`, `ethiopian`, `hijri`), `footnote` |
| `quote` | One strong sentence in large type: a mission, a verse, a founder's words. Its words darken one by one as it scrolls in | `quote`, `name`, `role`, `image` |
| `marquee` | A ribbon of 3 to 8 short words moving slowly across the page, between two sections: places, dishes, promises ("Lalibela ✦ Simien ✦ Danakil") | `items[]`, `tone` (`dark`, `primary`, `light`) |
| `tabs` | 2 to 6 topics where each tab swaps a picture and a short text: programmes, departments, room types, service days | `items[]` (`label`, `heading`, `body`, `image`, `points[]`, `action`) |
| `give` | Donations: amount buttons, once or monthly, what each amount does, a goal bar; the button fills in the giving `form` (give the form an `amount` field, and a `frequency` select with "Once"/"Monthly" when `monthly` is on) | `amounts[]` (`price`, `impact`), `monthly`, `action` (to the form, e.g. `#give`; write `{amount}` in its label where the amount goes, e.g. "{amount} ይለግሱ"), `goal` (`raised`, `target`, `label`), `image` |
| `gallery` | Photos; each opens large in a viewer | `layout` (`mosaic`, `scroll`, `wall`, `prints`: 3 to 6 photos laid askew like prints on a table), `images[]`, `intro` |
| `contact` | Call / Telegram buttons, phone, address, hours (from `business`) | `heading`, `intro` |
| `map` | Location card that opens the maps app | `heading`, `query` (defaults to the English address) |
| `testimonials` | Customer quotes (only real ones the owner gave) | `items[]` (`quote`, `name`, `role`) |
| `timeline` | Personal sites (work, studies), "our story", milestones | `heading`, `intro`, `items[]` (`period`, `title`, `place`, `description`), newest first |
| `faq` | Questions customers always ask (booking, delivery, payment, what to bring). 3 to 6, short answers, only facts the owner gave or plain how-to | `heading`, `intro`, `items[]` (`question`, `answer`) |
| `cta` | One clear ask on a dark band, usually the last section of the home page | `heading`, `body`, `primaryAction`, `secondaryAction`, `image` (a photo behind the band) |
| `form` | Contact, booking, order or registration forms. Answers reach the owner's dashboard and Telegram | `id` (required, e.g. `"booking"`), `kind`, `heading`, `intro`, `fields[]`, `submitLabel`, `successMessage` |

Form fields: `{ "name": "phone", "label": {...}, "type": "tel", "required": true }`. Types: text, email, tel, date, time, number, select (with `options`), textarea. Keep forms short (2 to 6 fields). Never ask for passwords, PINs, card numbers, bank details or ID numbers. Add a form when the owner wants bookings, orders, registrations or messages; link to it with `"#<id>"` (for example a hero button to `"#booking"`).

Every section with a title except `stats` and `cta` also takes `eyebrow`: two or three words above the title ("Our rooms", "Since 2012"). Use it on most sections of a site, never repeating the title.

Icons for `services`: coffee, utensils, bed, stethoscope, school, shopping-bag, church, calendar, heart, home, map, scissors, car, star, phone, check, wifi, clock, users, shield, leaf, award, globe, briefcase, camera, music, book, sparkles, truck, key, building, sun, plane, moon, droplet, mail, message, baby, palette, wrench, chart, graduation, pill, flask, mountain, tree, gift, ruler, bath, pin, laptop, handshake, mic, flower, dumbbell, bus.

Cards: `stack` for 3 or 4 big cards that pile up as the visitor scrolls (rooms, programmes, projects: an impressive centrepiece, one per page); `index` for a list of big titles where the picture follows the mouse on computers (portfolio work, collections); `grid` for things to compare (properties, products, programmes; put price, `meta` facts like "3 beds", "120 m²", "8 days" and a `badge` like "For sale"); `feature` for a few things that deserve a large picture each (rooms, projects); `scroll` for a row of tall picture cards to swipe (destinations, experiences, collections); `people` for portraits with a name (`title`) and role (`subtitle`). `pricing` for 2 to 4 plans side by side (memberships, packages, course fees): `title`, `subtitle`, `price`, `priceNote`, `meta` as the ticked list of what is included, one `action`; the plan with a `badge` ("Most chosen") stands out on a dark card, so give a badge to one plan only. Give card `action`s a label that says what happens ("Book this room", "Ask about this home").

## Drawings (`image.art`)

When there is no photo yet, `art` picks a drawing in the site's colours instead of an empty box:

| `art` | Shows | Use for |
| --- | --- | --- |
| `coffee` | A jebena and cups | Cafés, coffee |
| `food` | A shared plate | Restaurants, catering |
| `hotel` / `room` | A lodge by the water / a made bed | Hotels, guest houses, rentals |
| `clinic` | A cross and a heartbeat (drawn in the accent colour; don't choose a red accent for a clinic) | Clinics, pharmacies, health |
| `school` | A book, a pencil, a star | Schools, courses, tutoring |
| `fashion` / `shopping` | A dress with a woven band / a bag and parcels | Clothes and tailoring / any shop |
| `church` / `mosque` | The building (the church is a gabled hall with a cross; for an Orthodox church prefer the owner's photo) | Places of worship |
| `event` | A stage with flags | Events, weddings, music |
| `people` | Three people together | Teams, community, NGOs, families |
| `home` | Houses on a street | Real estate, construction |
| `mountains` | Highland peaks and a path | Tours, travel, outdoors |
| `portrait` / `work` | A person in an arch / framed work | Personal sites, portfolios |
| `dashboard` / `mobile` / `chart` | A software dashboard / a phone with a finished sale / a rising sales chart | Software, apps, online services: the product, until the owner adds real screenshots |

Give the home hero and the `about` section a drawing that fits the business, and vary them (don't repeat one drawing down the page). Leave `art` out for a calm abstract shape. Once the owner uploads a photo, set `src` and remove `art`.

## What the best sites of each kind do

Build the home page in the order visitors of that kind of business look for things. These orders come from studying the best sites in each field.

| Business | Style | Home page, top to bottom |
| --- | --- | --- |
| Hotel, lodge, guest house | `editorial`, font `elegant` | `immersive` hero (place as eyebrow, 2 to 5 word headline, one booking button, `facts`: rooms, distance, from-price) → `about` welcome → rooms as `cards` `feature` with `meta`, price and `priceNote` "per night" → amenities as `services` `list` → experiences as `cards` `scroll` → `gallery` → `testimonials` → booking `form` → `faq` → `map` → `cta` with a photo |
| Café, restaurant | `warm`, font `classic` | `immersive` hero with "See the menu" → signature dishes as `cards` `grid` with prices → `about` → `gallery` → `testimonials` → `contact` + `map` → `cta`; the full `menu` on its own page |
| Clinic, dental | `clean`, font `modern` | `split` hero with "Book an appointment" and the phone → `services` `bento` in patient words → `stats` → doctors as `cards` `people` → `steps` (how a visit works) → `testimonials` → `faq` → booking `form` → `contact` + `map` |
| School | `clean` or `warm`, font `friendly` | `split` or `immersive` hero with "Apply" and "Book a visit" → `stats` → programmes as `cards` `grid` by age or grade → `about` (director's welcome) → admissions as `steps` → term dates as `schedule` → parent `testimonials` → `faq` → enquiry `form` |
| Shop, boutique, crafts | `editorial` or `warm` | `centered` or `immersive` hero with "See products" and "Order on Telegram" → collections as `cards` `scroll` → products as `cards` `grid` with price and an order `action` → `steps` (how to order) → `about` the makers → `testimonials` → `contact` + `map` |
| Church | `warm`, font `classic` | `immersive` hero with "Service times" → `schedule` of services → `about` welcome → ministries as `cards` `grid` → `quote` (a verse) → giving as `services` → `contact` + `map` |
| Mosque | `clean`, font `modern` | `immersive` hero → `schedule` `tiles` with the five prayers and Jumu'ah → services (nikah, janazah, madrasa) as `services` → classes as `schedule` `list` → `about` → giving → `contact` + `map` |
| Events, weddings | `editorial`, font `elegant` | `immersive` hero, one button → event types as `cards` `scroll` → `gallery` → packages as `cards` `grid` with "from" prices → `steps` → one big `quote` from a couple → `about` the planner → enquiry `form` (date, guests) |
| NGO, charity | `bold`, font `grotesk` or `friendly` | hero that states the goal in under 12 words, "Donate" and "Our work" → `stats` → `about` mission → programmes as `cards` `grid` → one person's story as `quote` with a photo → how gifts are used as `services` `numbered` → `cta` |
| Real estate | `clean`, font `modern` | `immersive` or `banner` hero → listings as `cards` `grid` (`badge` "For sale"/"For rent", price, `meta` beds, baths, m²) → `stats` → featured project as `about` with `points` → why us as `services` → `testimonials` → viewing `form` |
| Tours, travel | `bold`, font `grotesk` | `immersive` landscape hero, "See our tours" → `facts` or `stats` → trips as `cards` `grid` (`badge`, `meta` days and difficulty, from-price) → destinations as `cards` `scroll` → why us as `services` → `steps` → guide story `about` → `testimonials` → enquiry `form` |
| Personal, portfolio | `bold`, font `grotesk` | `portrait` hero (place and "Available for work" as eyebrow, name or role as a huge statement) → selected work as `cards` `feature` → `services` `numbered` → `about` → `timeline` → `testimonials` → contact `form` |
| Company, consulting | `clean`, font `modern` or `grotesk` | `split` hero with an outcome statement and "Request a quote" → `stats` → `services` `bento` → projects as `cards` `grid` → `steps` (how we work) → `about` → team as `cards` `people` → `testimonials` → enquiry `form` |
| Fashion, habesha dress maker, tailor | `luxe`, font `elegant`, radius `none`, `highlight` gold | `poster` hero ("See the collection", "Made to measure") → promises as a dark `marquee` → pieces as `cards` `scroll` (`badge` Women/Men/Couples, `meta` sizes and "Made to measure", price) → made-to-measure `steps` → `about` the looms → `gallery` `wall` of customers → `testimonials` from abroad → `cta` before the next holiday; order `form` with country and notes |
| Building materials, hardware, contractor | `swiss`, font `condensed`, radius `none`, `highlight` safety yellow | `split` hero with `facts` → today's prices as `menu` `layout: "table"` (each item's `unit`: quintal, bar, m²; `tag` "In stock") → what you supply as `cards` `grid` → `stats` `dark` → ordering `steps` → projects as `cards` `feature` → quote `form` (products, quantities, site, date) → licences as `about` `points` → `cta` |
| Garage, car service, car rental | `bento`, font `condensed`, radius `large`, `highlight` amber | `bento` hero ("Book a service", "Rent with a driver", one fact) → service prices as `menu` `layout: "table"` → `steps` (we call with the price first) → fleet as `cards` `scroll` (`meta` seats, "With driver", "Airport pickup", price with `priceNote` "per day") → services as `cards` `grid` → `testimonials` → booking `form` (car, plate, service, day) |
| Bakery, cake shop | `organic`, font `classic`, radius `large`, `highlight` honey | `split` hero with a `stamp` ("Order a cake", "See our cakes") → holidays as a `marquee` `primary` → cakes as `cards` `grid` (`badge`, `meta` sizes and servings, "from" price) → daily bread as `menu` with a few `image`s → ordering `steps` → sending a cake from abroad as `about` with `points` → `gallery` `prints` → `testimonials` → `cta` before the next holiday |
| Wedding photographer, studio | `cinematic`, font `editorial`, radius `none` | `immersive` hero ("Is my date free?", "See weddings") → the latest wedding as `gallery` `prints` → `about` the photographer → packages as `cards` `pricing` → `steps` → one couple's `quote` → date `form` (date, place, package, country if abroad) → `cta` |
| Training centre, tutoring, driving school | `brutal`, font `grotesk`, radius `medium`, `highlight` yellow | `split` hero with a `stamp` (next intake) → `stats` `dark` → courses as `cards` `grid` with `filters` (`badge` subject, `meta` length, times, next class, fee with `priceNote`) → `steps` to the certificate → `schedule` `week` → teachers as `about` with licence `points` → `testimonials` → registration `form` → `faq` |
| Pharmacy | `calm`, font `modern`, radius `small` | `split` hero ("Ask if it's in stock", "Call") → health checks as `services` `numbered` → prescriptions by Telegram as `steps` → licence as `about` with `points` (responsible pharmacist, EFDA licence number, outlet type) → stock question `form` → `faq` → `map`. Never name medicines, brands or medicine prices (advertising them is not allowed), and never collect prescriptions in a form: send them to Telegram, and keep the form's line asking visitors not to write prescriptions or health details |
| Luxury hotel, resort, boutique hotel, spa retreat | `grand`, font `elegant`, radius `none`, `highlight` champagne, ivory background, charcoal accent, muted gold primary | full-screen `immersive` hero with a short heading of four to six words ("Reserve your stay", "Discover the suites") → the house as `about` (`imageSide` `start`) → signature suites as `cards` `feature` (3, `meta` guests, m², one feature; nightly rate with `priceNote`) → experiences as `tabs` with a photo each → a second `immersive` hero further down for the destination (no actions needed) → journeys as `cards` `scroll` → `testimonials` (3) → `cta` with a dusk photo; rates on their own page as `cards` `grid`, `services` `numbered` with an `image`, `faq`; a reservation page with the booking `form`, `contact` and `map` |
| Creative agency, design or architecture studio, production company | `avant`, font `grotesk`, radius `none`, black text and accent on an off-white background, one electric `primary` (also the `highlight`) | `centered` hero with no picture: a five or six word heading (the second word turns the colour, the third is outlined) and "Start a project", "See the work" → a short `about` with a small picture → selected work as `cards` `grid` (4, `subtitle` the discipline, `meta` year and what was made) → `services` `numbered` (3 to 5) → a `marquee` `primary` of disciplines → two featured projects as `cards` `feature` → the philosophy as a `quote` without a name → clients' words as `testimonials` → `cta` with no photo; all work on its own page as `cards` `index`; a contact page with a project `form` and `contact`. Never list client names in a `marquee` or elsewhere unless the owner gave them |
| Software, app, online service, fintech | `precise`, font `modern`, radius `medium`, a near-white background, near-black text and accent, one distinctive `primary` | `centered` hero with a product drawing as its `image` (`art` `dashboard`) and "Start free", "See pricing" → `stats` with a heading (only numbers the owner gave) → features as `tabs`, each with a drawing (`mobile`, `dashboard`, `chart`) and two `points` → why it suits here as `about` with a drawing and `points` → integrations as `services` `bento` with icons (name kinds of tools, not brands the owner didn't name) → `testimonials` → `cta`; plans on their own page as `cards` `pricing` and `faq`; a sign-up page with a `registration` `form` and `contact`. Use the owner's real screenshots as photos when they have them |
| Fashion label, boutique, concept store (selling pieces) | `monochrome`, font `editorial`, radius `none`, black `primary`, `accent` and `text` on white | full-screen `immersive` campaign hero with a two or three word heading ("Shop the season", "Our story") → the season as `cards` `scroll` (title, sizes as `subtitle`, price, "Order this piece") → the making as `about` with a large photo → one line as a `quote` without a name → three chosen pieces as `cards` `grid` (the first shows large) → categories as `cards` `index` → a newsletter `form` (one email field) as the last section; all pieces on a shop page as `cards` `grid` with `badge` categories (filters); an order page with an `order` `form` (piece, size, country) and `contact`. For a tailor or made-to-measure maker use the Fashion row above |
| Architect, interior designer, engineering firm, furniture maker | `drafting`, font `modern`, radius `none`, near-black `primary`, `accent` and `text` on a warm paper background | `immersive` hero with `frame` (the building; coordinates or the city as eyebrow, "Selected work", "Start a project") → the studio as `about` with a small photo → three projects as `cards` `grid` (`subtitle` the type, `meta` place, year and area) → a second `immersive` hero for the city or a view → principles as `services` `numbered` (3) → a statement as a `quote` without a name → `stats` (only the owner's numbers) → `cta`; all projects on their own page as `cards` `grid`; a contact page with a project `form`, `contact` and `map` |
| Fine dining, chef's table, wine or cocktail bar | `noir`, font `elegant`, radius `none`, a deep `accent` (the room: charcoal, brown, oxblood), a light `background` (the ink), a brass or copper `primary`, dark `text` | `immersive` hero with a dark food photo, centred ("Reserve a table", "The menu") → the philosophy as a `quote` without a name → three signature dishes as `cards` `feature` → the kitchen as `about` (no chef's name with a sample photo) → `menu` `list` with courses and prices → the room as `gallery` `mosaic` → `testimonials` → `cta` with a dark photo; a reservation page with a `booking` `form` (date, time, guests, notes), `contact` and `map` |
| Developer, designer, illustrator portfolio (interactive) | `folio`, font `grotesk`, radius `small`, near-black `primary`, `accent` and `text` on paper, a bright `highlight` (the marker) | `portrait` hero with availability as the eyebrow, a five or six word statement, a `stamp` and "See the work", "Say hello" → work as `cards` `index` (`subtitle` the kind, `meta` year and tools) → two case studies as `cards` `feature` with a longer `description` → skills as `services` `numbered` → `timeline` → a belief as a `quote` without a name → `cta`; all work on its own page as `cards` `grid`; a contact page with a short `form` and `contact`. For a quieter personal site use the Personal row |
| Gym, fitness, boxing club | `kinetic`, font `condensed`, radius `small`, `highlight` lime | `immersive` hero with a two-word heading ("Book a free first visit", "See memberships") → `stats` `dark` → ways to train as `cards` `grid` → memberships as `cards` `pricing` → `schedule` `week` (`note` "Women only" where it applies) → `testimonials` → free visit `form` |
| Salon, barber, spa | `editorial` (salon) or `bold` (barber) | `immersive` hero with "Book now" and "See prices" → price list as `menu` → `gallery` → stylists as `cards` `people` → `testimonials` → `about` → `contact` + `map` |

Rules that hold for all of them: one main action, repeated with the same words (hero, middle, end); prices visible wherever the owner gave them; the offer before the story; real numbers or none.

## A good home page

Follow the order for the kind of business in the table above. For a kind that isn't listed: hero (with a photo or a drawing, and a button to the thing visitors want: menu, booking, call) → what you offer (`cards`, `menu` or `services`) → `about` → `faq` when the owner gave enough to answer real questions → `contact` (and `map`) → `cta` as the last section.

On phones a bar with Call and Telegram (or WhatsApp) appears by itself when `business.phone`, `telegram` or `whatsapp` is set, so fill those in whenever the owner gives them. The `split` hero also shows the first `business.hours` lines beside its picture; don't repeat the hours in the hero `eyebrow`, use it for the place or what makes the business special.

Owners can also change the phone, Telegram, WhatsApp, address, opening hours and a one-line banner in their dashboard without you; the live site shows those over `business` and `announcement` (it keeps yours when they set nothing).

For a person, use first-person, warm copy; `highlights` and `facts` only with facts they gave; no prices unless they gave them; leave out `business.hours`.

## Design and motion

Sections already animate (gentle reveal on scroll, lift and tilt on cards, a soft glow behind the hero, cross-fades between pages) and respect "reduce motion". Headings use a real display font chosen by `theme.font`: `classic` (Fraunces, a warm serif: cafés, shops, worship), `elegant` (Cormorant Garamond, a fine light serif: hotels, weddings, fashion, salons), `modern` (Outfit, clean: clinics, real estate, companies), `grotesk` (Bricolage Grotesque, strong and characterful: personal sites, tours, causes, agencies), `friendly` (Nunito, rounded: schools, children, community), `condensed` (Archivo, tall, narrow and heavy: building materials, garages, gyms; Amharic headings get a matching narrow Ge'ez), `editorial` (Newsreader, a light magazine serif: weddings, photographers, studios).

`theme.style` sets the site's whole character: `warm` (default: soft cards, coloured accents), `editorial` (light serif headlines, small capital labels, lots of air: pair with `elegant` or `classic` and radius `none` or `small`), `bold` (very large heavy headlines, pill buttons: pair with `grotesk` or `modern`), `clean` (crisp and calm with soft shadows: pair with `modern` or `friendly`), `luxe` (high-fashion editorial: hairlines instead of boxes, tracked capitals, square buttons, a woven tibeb band under the first section: pair with `elegant` and radius `none`), `swiss` (a strict grid, sections numbered 01, 02 above their titles, condensed capitals, monospace figures, square corners and a hazard stripe under the first section: pair with `condensed` and radius `none`), `bento` (everything in rounded tiles with tight gaps and heavy numbers: pair with `condensed` and radius `large`), `organic` (soft and handmade: centred titles, pill labels on the highlight, scalloped edges between bands: pair with `classic` and radius `large`), `cinematic` (dark and quiet like a film: galleries on black, section titles numbered I, II, III: pair with `editorial` and radius `none`), `brutal` (thick borders and hard shadows, like a printed poster: pair with `grotesk` and radius `medium`), `calm` (quiet and spacious, thin lines, no decoration: pair with `modern` and radius `small`; for pharmacies and clinics), `kinetic` (huge condensed capitals that slide in, the second headline word in outline: pair with `condensed` and radius `small`; keep the hero heading to two or three words). `grand` (luxury hospitality: oversized light serif titles, small tracked labels in the gold primary after a long hairline, square buttons, a hairline frame inside full-screen photos, photos that open like a curtain and drift slowly inside their frames, rooms set large in an uneven rhythm and numbered N° 01, guests' words in large serif type between hairlines, a full-width photo call to action, and a phone menu that opens as a sheet of large serif links: pair with `elegant`, radius `none` and a champagne `highlight`; `primary` must read as small text on the background and on white, 4.5:1). `avant` (an experimental studio: black and white with one electric colour, huge heavy grotesque headlines whose words drop in and drift apart as the page scrolls, the second word in the colour and the third outlined, sections numbered (01), (02), thick rules, square buttons with hard shadows that lean towards the mouse, a cursor ring, photos in grey that turn to colour and bend when pointed at, a broken grid of work with titles laid over the pictures, services as a big numbered index, featured projects with a text box over a full-width picture, a black statement band and a contact band in the colour: pair with `grotesk`, radius `none`, and a `primary` that reads on the background and white, 4.5:1). `precise` (a software product in the Swiss manner: twelve columns drawn in hairlines behind the hero, tight medium-weight headings, tabular figures, a small dot label above the headline, the product framed like a window with a soft shadow, features as a segmented control, integrations as tiles sharing their borders, the chosen plan outlined in the accent, quotes in quiet bordered cards: pair with `modern`, radius `medium`, and a `primary` that reads on the background and white, 4.5:1). `monochrome` (a fashion shop set like a magazine: black and white with the photos as the only colour, a light serif, small tracked capitals, the name centred in the menu bar on computers, products as tall portraits with the name and price beneath, the first of three chosen pieces large, categories as big titles, a black newsletter band and a white footer: pair with `editorial`, radius `none`, and black `primary`, `accent` and `text`). `drafting` (an architecture studio set like a drawing sheet: warm paper with a faint drafting grid, black ink rules, small capitals with tabular figures, projects numbered A-01, A-02 with place, year and area in columns like a title block, uneven project picture sizes, photos that open from a vertical line, a ruled call-to-action box and a paper footer: pair with `modern`, radius `none`, and near-black `primary`, `accent` and `text`). `noir` (fine dining by candlelight: the whole page turns dark from the theme's own colours (the `accent` becomes the room, the `background` the ink, the `primary` the brass details), so keep the theme light-first as usual; centred serif titles, spaced capitals, photos that rise out of the dark, dishes in vignettes, a menu like a printed card with dotted leaders: pair with `elegant`, radius `none`, a deep `accent` and a warm metallic `primary` that reads on both the light background (3:1) and the dark room). `folio` (a creative developer's notebook: paper with a dot grid, labels in monospace like code comments (// selected work), a huge heavy statement with a marker swipe behind its second word that drifts apart as the page scrolls, the portrait tilted with its stamp, work as a numbered index whose row fills with the marker colour and whose picture follows the mouse, a cursor dot and buttons that lean towards the mouse, a black contact panel: pair with `grotesk`, radius `small`, near-black `primary`, `accent` and `text` and a bright `highlight`). An `immersive` hero can also be used once further down a page, for a destination or a view: it fills the screen and its photo drifts as it passes. `theme.highlight` is an optional bright fill (safety yellow, Meskel yellow, tibeb gold) for stripes, tags, the hours tile and woven bands; it is never used for text.

Choose the hero `variant` to fit: `poster` for a magazine cover: a full-width tall photo with the business name set very large across its lower edge and the `eyebrow` running up the side (fashion, studios; a portrait photo whose top half holds the subject; best with a name of one to three short words, since a long name wraps onto several big lines), `bento` for a first screen of tiles: the heading on the photo, then opening hours, the two actions and the `facts` each in their own tile (garages, rentals, services; up to four small tiles fit beside the photo, so with hours and two actions only the first fact shows), `immersive` for a full-screen photo with the words on it (needs a wide photo that is dark or calm in its lower two thirds, where the words sit; never one with faces or bright sky there; the menu sits on the photo), `split` for text beside a photo, `centered` for a strong statement with a wide photo under it, `banner` for words on a tinted photo (inner pages), `portrait` for a person. With 4 or more `services` the first becomes a large feature tile, so put the most important one first. In a `gallery` of 5 or more the first photo is shown large.

## Motion and interaction

Every site moves the way the best sites do, by itself: hero words rise in, the hero photo settles and drifts, photos wipe in, rows arrive one after another, numbers count up, a thin bar shows reading progress, the home page's main button sits in the header on computers, and elegant or bold sites close the footer with the name in large type. All of it respects visitors who ask for less motion and costs almost nothing to load. What you choose:

- One impressive centrepiece per home page: `cards` `stack`, `gallery` `wall`, `cards` `index`, a `tabs` section, or `give` for causes. Don't stack them all on one page.
- A `marquee` between two sections when the business has short, strong words (places, dishes, values); at most one per page.
- `quote` for one big sentence; its words darken as the visitor reads.
- `stamp` on a hero for a short identity line ("Woven by hand · Merkato"): at most one site in three needs it (shops, personal sites, cafés); never on a page that also has a `marquee`. Sites should not all look alike: use few of these extras, chosen for the business.
- `imageShape: "arch"` for elegant sites (hotels, weddings, worship, salons).
- A card's `photos[]` (grid cards) are swiped inside the card with a 1/4 counter: several views of a home or room.
- `announcement` (site level): two or three short lines in a thin moving strip above the menu ("Order on Telegram", "Delivery in Addis").
- Card `badge`s with two or more kinds give filter pills by themselves ("For sale" / "For rent").
- Menus with three or more categories get tabs by themselves.

## Sample photos

Reference as `"src": "/stock/<name>.webp"`. Each photo is served in the size the screen needs. Names with `-hero-` are wide photos that suit `immersive` and `banner` heroes and photo `cta` bands. Choose by what the photo shows, from any group. Don't use one photo twice on a page.

<!-- stock:start -->
- `bakery-about-baker-shaping-dough`: A baker's hands press and shape bread dough on a floured work table beside rows of dough balls.
- `bakery-card-birthday-cake-sparkler`: A person places a lit sparkler on a layered chocolate cake with cream filling on a white cake stand.
- `bakery-card-black-forest-cake`: A three-layer chocolate black forest cake with cream, dark cherries and chocolate glaze on a white plate.
- `bakery-card-croissants`: Golden flaky croissants on a metal cooling rack.
- `bakery-card-fresh-bread-loaves`: Golden-brown round artisan bread loaves cooling on a rack in a bakery kitchen.
- `bakery-card-white-tiered-wedding-cake`: A white three-tier wedding cake decorated with pink, red and peach roses and peonies.
- `bakery-gallery-cake-slice`: A slice of vanilla layer cake with cream filling on a white plate.
- `bakery-gallery-cupcakes`: Chocolate and vanilla cupcakes with swirled frosting arranged on a rustic wooden board.
- `bakery-hero-bakery-counter-cakes`: Chocolate cakes and a strawberry-topped cake sit on brass cake stands behind the glass of a warm-lit cafe counter.
- `bakery-hero-layered-flower-cake`: A tall semi-naked layer cake with white frosting and caramel drips, topped with fresh red and pink flowers, lit softly from the side.
- `business-about-handshake-team`: Three formally dressed African men laughing and shaking hands outdoors with palm trees behind.
- `business-about-office`: Modern office corridor with black-framed glass partition walls, pendant lamps and a lounge area.
- `business-card-addis-towers`: Vertical view of Addis Ababa's glass high-rise towers above green trees under a blue sky.
- `business-card-analytics`: Over-the-shoulder view of a person in a navy blazer working on a laptop showing pie and bar charts.
- `business-card-construction`: Curved multi-storey building under construction with scaffolding and a tower crane, red-leaved trees in front.
- `business-card-warehouse`: Large logistics warehouse with orange pallet racking and motion-blurred workers in hi-vis vests walking the aisle.
- `business-gallery-handshake`: Close-up of two Black businesspeople shaking hands in an office, sleeves in blue and white shirts.
- `business-gallery-three-colleagues`: Three Black men in smart-casual clothes discussing around a white table with laptops and a tablet.
- `business-hero-addis-street`: Elevated dusk view of a busy Addis Ababa avenue lined with modern glass mid-rise buildings and traffic.
- `business-hero-team-meeting`: Five Black professionals in a bright meeting room around a white table, led by a man in a suit (a small laptop-lid logo is visible).
- `cafe-about-ceremony-incense`: Portrait view of an Ethiopian coffee ceremony: jebena pouring into cini cups, incense smoking in a clay burner, baskets of green coffee beans on grass.
- `cafe-about-roasted-beans-pan`: Hands of a woman in traditional striped dress holding a clay pan of freshly roasted coffee beans with a metal stirring spoon.
- `cafe-card-injera-veg-plate`: Top view of a white plate with two rolls of injera, red lentil stew, yellow lentils and collard greens garnished with parsley.
- `cafe-card-jebena-pour`: A hand pours coffee from a brown clay jebena into a white cup on a wooden tray scattered with coffee beans, warm blurred interior behind.
- `cafe-card-latte-glass`: A milky coffee with rosetta latte art in a clear double-walled glass on a worn wooden table.
- `cafe-card-tibs-injera`: Top view of a black clay plate of beef tibs, kitfo and ayib cheese beside a basket of rolled injera and a small bowl of mitmita spice on a wooden table.
- `cafe-gallery-bread-baskets`: Hands of a woman in traditional dress cutting round ceremonial bread (difo dabo) in a woven basket, with other woven baskets around.
- `cafe-gallery-cini-cups-tray`: used traditional cini coffee cups on an engraved metal tray with an older hand reaching for one (moody; cups are empty/used).
- `cafe-gallery-pastries-coffee`: A cafe table with a latte in a black cup surrounded by a croissant, a fruit danish and sugared doughnuts on plates.
- `cafe-hero-clay-pot-dish`: Close-up of a row of black clay pots of food garnished with a green herb sprig, with a softly blurred dark-and-cream restaurant background (calm area top and left).
- `cafe-hero-coffee-ceremony-pour`: A woman in a white habesha dress with woven tibeb trim pours coffee from a black clay jebena into rows of small cini cups set in a carved wooden chest.
- `clinic-about-newborn-care`: Nurse in cap and gown gently tending a sleeping newborn wrapped in a lilac blanket in a neonatal ward with leaf murals on the wall.
- `clinic-about-ultrasound-room`: Two smiling nurses (white and green uniforms) performing an ultrasound scan on a patient lying on a bed in a clean, bright examination room.
- `clinic-card-doctor-portrait`: Smiling Black woman doctor in a white coat holding a stethoscope towards the camera, outdoors in front of glass doors.
- `clinic-card-lab-microscope`: Black woman lab technician in white coat and blue gloves looking through a microscope in a bright laboratory, test tubes in the foreground.
- `clinic-card-nurse-portrait`: Portrait (vertical) of a smiling African nurse in light-blue scrubs with a stethoscope, against a teal wall.
- `clinic-card-pharmacy`: A man in a white shirt and a woman in a pink blouse reading a medicine box together beside bright white pharmacy shelves.
- `clinic-gallery-blood-pressure`: Clinician in a white shirt fitting a blood-pressure cuff on a seated young man in an examination room with a green wall.
- `clinic-gallery-dental`: Dental clinician in teal scrubs, cap and mask adjusting the lamp over a patient in a dental chair, soft blue-white room.
- `clinic-hero-doctor-clipboard`: Young Black male doctor in white coat, glasses and teal stethoscope writing on a blue folder against a plain white wall; the left third is empty white space for text.
- `clinic-hero-two-nurses`: Two smiling African nurses in green scrubs with stethoscopes, arms crossed, in a bright clinic room with a pale grey wall.
- `construction-about-smiling-site-workers`: A group of smiling young African construction workers in yellow and orange safety vests and hard hats posing together on a dusty building site with scaffolding behind.
- `construction-card-aluminium-profile-measuring`: Hands marking a black aluminium window profile with a red pencil and a yellow tape measure on a workshop bench.
- `construction-card-cement-bags-pallet`: Orange and brown paper cement bags stacked on a wooden pallet on a concrete loading platform in daylight, with no visible branding.
- `construction-card-ceramic-floor-tiles`: A gloved hand pressing a large light grey ceramic floor tile onto combed grey adhesive, with blue and green tile levelling clips between the tiles.
- `construction-card-open-paint-cans`: Many open paint cans crowded together, filled with blue, yellow, purple, green and white paint with drips on the rims.
- `construction-card-steel-rebar-stack`: Close-up of a bundle of ribbed steel reinforcing bars lying in parallel, dark grey with orange rust patches.
- `construction-gallery-apartment-building-luanda`: A finished white multi-storey apartment building with curved balconies behind large green trees and a clean road in Luanda, Angola, under a blue sky with light clouds.
- `construction-gallery-interior-wall-painting`: A kneeling painter in a grey shirt rolling white paint onto an interior wall edged with blue masking tape, with a paint tray on paper-covered floor.
- `construction-hero-site-mixer-steel-columns`: A construction site in warm sunlight with formwork-wrapped columns, steel reinforcing bars rising into the sky, scaffolding and a cement mixer on dusty ground.
- `construction-hero-steel-materials-yard`: An outdoor building materials yard with large stacks of galvanised and blue-painted steel profiles on sandy ground, a palm tree and corrugated sheds behind, under a pale sky.
- `events-about-bridal-party-garden`: East African bridal party (groomsmen in beige suits, bridesmaids in rust satin dresses) dancing in procession across a sunny garden beside a white marquee.
- `events-about-wedding-party-dancing`: Black African bride in a white satin gown dancing outdoors at night with groomsmen in waistcoats and bridesmaids in pale green dresses.
- `events-card-corporate-conference-hall`: Modern empty conference hall with round white tables, white chairs, a timber ceiling and three blank projection screens.
- `events-card-decor-floral-centrepiece`: Tall peach-and-pink rose centrepiece on a gold stand in a white marquee with round tables and gold chiavari chairs softly blurred behind.
- `events-card-graduation-friends`: Three laughing East African graduates in black gowns with yellow hoods and mortarboards celebrating outdoors among greenery.
- `events-card-wedding-couple-petals`: Smiling Black African bride and groom walking out of a brick chapel hand in hand while guests throw flower petals (a few guests wear face masks).
- `events-gallery-bride-veil-bouquet`: Portrait-orientation photo of a smiling Ethiopian bride lifting her lace veil over a bouquet of white roses and baby's breath against a plain pale wall.
- `events-gallery-habesha-dress-celebration`: Portrait-orientation photo of young women in white embroidered habesha dresses with green grass skirts clapping and singing at an Ethiopian street celebration (Ashenda style); one holds a microphone.
- `events-hero-chandelier-banquet-hall`: Grand golden banquet hall with large chandeliers, set dinner tables, tall flower arrangements and an open polished floor in the foreground; no people.
- `events-hero-floral-arch-reception-hall`: Warm cream-and-gold draped reception hall seen down a white aisle through a floral arch, with chair-covered tables and a bridal stage in the distance; no people.
- `fashion-about-handloom-weavers`: Two young Ethiopian men at an outdoor wooden handloom weaving red, green and black striped cloth under banana leaves, with finished white shawls with coloured borders hanging in the foreground.
- `fashion-card-couple-matching-outfits`: A smiling Ethiopian couple in matching white traditional outfits with gold and green embroidered borders, standing by a waterfront with a city skyline behind them in warm daylight.
- `fashion-card-habesha-dress-on-grass`: A young Ethiopian woman sitting on green grass in a white habesha dress with bold green, red and black tibeb embroidery running down the front and along the sleeves.
- `fashion-card-man-gabi-orange-wall`: A young Ethiopian man with an afro wrapped in a white traditional cotton shawl with blue, orange and green stripes, standing against an orange metal shutter.
- `fashion-card-netela-shawl`: A woman with a white headband holding a white netela shawl with a patterned woven border up to her face, in a sunlit dry golden field.
- `fashion-card-tailor-measuring-client`: An older tailor with grey hair and glasses measuring the waist of a young Black man in a white shirt and black waistcoat inside a tailoring studio with suits on mannequins.
- `fashion-gallery-loom-striped-threads`: Close view of a wooden handloom with brightly coloured striped threads in blue, green, yellow and pink stretched across it, outdoors under a blue sky.
- `fashion-gallery-two-friends-headbands`: Two smiling Ethiopian women with curly hair and red and gold beaded headbands, wearing white traditional dresses, posing close together outdoors at dusk.
- `fashion-hero-kemis-woman-green-field`: Portrait-orientation photo of an Ethiopian woman in a white habesha dress with blue tibeb trim and a green, yellow, red and blue sash, standing in a bright green field under a blue sky with hills behind.
- `fashion-hero-kemis-woman-rooftop`: Full-length portrait of an Ethiopian woman with red braided hair in a white habesha kemis with black and green woven tibeb embroidery, standing on a white rooftop wall with Addis Ababa behind her in soft daylight.
- `garage-about-mechanics-team-engine`: Two smiling young mechanics in Mozambique work together on an engine block with a wrench and a hammer.
- `garage-card-brake-repair`: A mechanic crouches at the front wheel arch of a raised car, working on the brake with the wheel removed.
- `garage-card-engine-diagnostics`: A mechanic in blue overalls holds a diagnostic tablet while checking the engine of an orange car with its bonnet open.
- `garage-card-fleet-minibus-side`: A white high-roof minibus parked side-on at a quiet airport drop-off zone.
- `garage-card-fleet-saloon-side`: A silver saloon car parked side-on in front of a plain red brick wall.
- `garage-card-fleet-suv-side`: A large silver seven-seat SUV parked side-on against a pale sky and trees.
- `garage-card-oil-check-dipstick`: A mechanic in blue overalls checks the engine oil level with a dipstick under an open car bonnet.
- `garage-card-tyre-wheel-service`: Two mechanics in overalls in a Nigerian workshop sit beside removed tyres while servicing the wheel hub of a white van.
- `garage-hero-car-on-lift-clean-bay`: A dark SUV raised on a two-post lift at the far end of a bright, clean, white-tiled workshop bay.
- `garage-hero-mechanic-under-bonnet`: A mechanic in blue overalls leans over the open bonnet of a white car, working on the engine in a tidy workshop.
- `gym-about-gym-floor-benches`: An empty, bright gym floor with rows of adjustable benches in front of racks of dumbbells and a mirror wall.
- `gym-card-boxing`: A man in boxing gloves throws a punch at a heavy bag in a dim gym lit in red and blue.
- `gym-card-group-outdoor-class`: A group of men and women in Uganda follow an instructor through an aerobics class on the grass in a park.
- `gym-card-stretching`: Two smiling women do a deep lunge stretch together in a bright studio with a wooden floor.
- `gym-card-trainer-coaching`: A personal trainer kneels beside a woman doing a dumbbell row on a bench, coaching her through the exercise.
- `gym-card-woman-barbell-squat`: Seen from behind, a woman in an orange top holds a padded barbell across her shoulders in a gym in Accra, Ghana.
- `gym-gallery-battle-ropes`: A man in a squat whips battle ropes on green turf inside a gym in Addis Ababa.
- `gym-gallery-dumbbell-rack`: Black hexagonal dumbbells on a vertical metal rack against a brick wall.
- `gym-hero-deadlift`: A man in a lifting belt holds a loaded barbell at the top of a deadlift in a gym in Addis Ababa.
- `gym-hero-dumbbell-press`: A man lies on a bench pressing two heavy dumbbells overhead in a moody, red and blue lit gym in Addis Ababa.
- `hotel-about-coffee-ceremony-host`: Woman in a white Ethiopian habesha dress pouring coffee from a clay jebena into rows of small cups on a carved wooden rekebot (face not shown).
- `hotel-about-thatched-lounge`: Open-air lodge lounge and dining area under a high thatched roof with cane armchairs and a leather sofa, bush garden beyond (square crop).
- `hotel-card-dining-bread-baskets`: Hands of a host in Ethiopian traditional dress cutting traditional bread (difo dabo) in a woven mesob basket, with more woven baskets alongside.
- `hotel-card-spa-massage`: African woman with eyes closed receiving a back massage from a therapist, lying on a white table with a pink towel.
- `hotel-card-standard-room`: Bright simple double room: white bed with ochre cushions and folded towels, arched headboard niche, two bedside lamps, woven rug.
- `hotel-card-thatched-suite`: Large thatched-roof suite with a draped four-poster bed and two cream armchairs around a carved stool (flash-lit, darker edges).
- `hotel-card-wooden-cabin-room`: Warm wood-panelled cabin bedroom with double bed, two round wicker chairs, curtains and a rug (extra card option).
- `hotel-gallery-bush-dining-acacia`: Long red-clothed dining table set in open savanna beside a lone acacia under a big cloudy sky (extra; also works as a hero, sky is a calm text area).
- `hotel-gallery-jebena-coffee-pour`: Close-up of a hand pouring coffee from an Ethiopian clay jebena into a white cup on a wooden tray scattered with beans (portrait).
- `hotel-gallery-veranda-dusk`: Colonnaded lodge veranda with stone base, downlights and garden lawn at dusk.
- `hotel-hero-infinity-pool-hills`: Curved infinity pool with loungers on a lodge terrace overlooking acacia-covered East African hills; pale calm sky in the upper half.
- `hotel-hero-lodge-pool-dusk`: Thatched lodge lit by lanterns at blue hour, reflected in a dark pool, framed by large trees; dark calm water in the lower third.
- `mosque-about-bright-prayer-hall`: Bright white and mint-green mosque prayer hall with chandeliers and mihrab, worshippers praying and sitting on a yellow patterned carpet.
- `mosque-about-courtyard-arches`: Historic stone mosque courtyard with arcades of arches and a green dome under a blue sky, shot from a low angle between columns.
- `mosque-card-quran-class-children`: Four children sitting on the floor reciting from Qurans on wooden stands in a madrasa class (South-East Asian setting).
- `mosque-card-quran-on-rug`: Top-down view of a green and gold Quran on a wooden rehal stand resting on a green prayer rug.
- `mosque-card-wudu`: Man in a striped robe and embroidered cap bending to wash his hands in ablution (wudu) at a fountain; small blurred figures in the background.
- `mosque-gallery-men-praying-from-behind`: Men kneeling and sitting on a red carpet facing the mihrab between marble columns, seen from behind, stained glass windows above.
- `mosque-gallery-timber-prayer-hall`: Modern mosque prayer hall with tree-like timber columns and skylights, one man sitting on the carpet (portrait orientation).
- `mosque-hero-minaret-dusk-skyline`: Silhouette of a minaret and mosque dome against a purple, pink and orange dusk sky, with large empty sky above and dark foreground below.
- `mosque-hero-sunlit-prayer-hall`: Lone worshipper kneeling, seen from behind, on a teal carpet in a large prayer hall with low sun streaming through arched windows.
- `ngo-about-girl-clapping-community`: Smiling girl in a red embroidered top clapping among a group of women and children at a community gathering.
- `ngo-about-women-group`: Four Ethiopian women in white netela shawls and a girl holding a red flower standing together on a cobbled street, looking at the camera.
- `ngo-card-teacher-classroom`: Classroom seen over a pupil's shoulder, with a teacher holding up a sheet of paper in front of a whiteboard (teacher out of focus).
- `ngo-card-tree-planting`: Volunteers in face masks and gloves planting a tree seedling in a forest, a woman in a hijab and a girl in a yellow hoodie in front (portrait orientation).
- `ngo-card-woman-farmer`: Portrait of a smiling woman in a headscarf and cross necklace standing among enset/banana leaves.
- `ngo-gallery-community-meeting`: Women in colourful dresses and headscarves seated on a wooden bench, seen from behind, at an outdoor community meeting.
- `ngo-gallery-smiling-girl`: Smiling Ethiopian girl in an embroidered traditional dress with a crowd blurred behind her (portrait orientation).
- `ngo-hero-grain-in-hands`: Close-up of a woman's cupped hands pouring harvested grain, with a bright blurred field and sky leaving the left half calm.
- `ngo-hero-highland-huts-meadow`: Two thatched round houses in a green highland meadow of yellow flowers with terraced hills and cloudy sky behind (Ethiopia).
- `personal-about-creative-desk`: Creative's wooden desk with pencils, brushes, books, rolled prints, a lamp and house plants.
- `personal-about-woman-orange-blazer`: The same woman in the orange blazer, standing off-centre to the right of a pale teal wall with space for text.
- `personal-card-brochure-layout`: Open printed brochure with a pink editorial layout and large 'GRAFICO' heading lying on a wooden surface.
- `personal-card-editorial-portrait`: Editorial fashion portrait of an African woman in a red hat and red patterned dress holding a woven bag.
- `personal-card-logo-tablet`: Hand with a stylus drawing a white bear-head logo on a black tablet screen at a desk.
- `personal-card-website-laptop`: Laptop on a desk showing a teal architecture website with the line 'Build your dream website', next to a black mug.
- `personal-gallery-lettering-sketches`: Hand-drawn logo and lettering sketches on loose paper and a sketchbook spread across a wooden desk.
- `personal-gallery-pattern`: Vintage geometric repeat pattern in orange, grey-blue and yellow (public-domain print).
- `personal-hero-man-turtleneck`: Studio portrait of a Black man with a short beard in a black turtleneck against a dark grey backdrop.
- `personal-hero-woman-orange-blazer`: Confident young Black woman with natural hair, arms crossed, in an orange blazer against a pale teal wall.
- `pharmacy-about-smiling-pharmacist-white-coat`: A smiling Black woman in glasses and a white coat gestures with open hands against a plain white background.
- `pharmacy-card-blood-pressure-check`: A health worker in a white coat measures the blood pressure of an older Nigerian woman in a patterned dress at an outdoor clinic.
- `pharmacy-card-blood-sugar-test`: Close-up of a Black woman's hands holding a glucose meter to test a drop of blood from her fingertip.
- `pharmacy-card-delivery-courier`: A Black courier with a backpack checks his phone on a scooter while carrying a brown paper delivery bag on a city street.
- `pharmacy-card-pharmacist-advice`: A pharmacist in a white coat explains a medicine box to an older woman beside wooden pharmacy shelves.
- `pharmacy-card-vitamins-blank-bottle`: An unlabelled white supplement bottle stands beside a glass of water and a few pink capsules on a beige surface.
- `pharmacy-gallery-pharmacy-interior`: An empty, tidy pharmacy interior with dark wooden glass-fronted cabinets, a long wooden counter and a chandelier.
- `pharmacy-gallery-shelves-soft-focus`: A pharmacist seen from behind stands before white shelves of medicine bottles whose labels are softly out of focus.
- `pharmacy-hero-lagos-pharmacy-customers`: A man in a white shirt and a woman in a pink blouse examine a medicine box together beside bright pharmacy shelves in Lagos, Nigeria.
- `pharmacy-hero-pharmacist-counter-customer`: A pharmacist in a white coat shows a pill bottle to an older Black woman across the counter of a pharmacy.
- `real-estate-about-addis-neighbourhood`: Daytime view over an Addis Ababa district of white and blue mid-rise blocks surrounded by dense green trees under a clear sky.
- `real-estate-about-team-three-men`: Portrait-orientation photo of three young African men in smart shirts and dark trousers standing on a stone path beside a building with greenery behind.
- `real-estate-card-apartment-block-yellow-balconies`: Newly finished nine-storey white apartment block with yellow balcony railings on a green hillside, a small excavator at its base.
- `real-estate-card-bright-living-room`: Bright minimalist living room with two grey velvet sofas facing each other, a pale rug, light oak floor, linear fireplace and sliding glass doors.
- `real-estate-card-midrise-apartments-balconies`: Contemporary mid-rise apartment building with glass balconies, large windows, pale cladding and a brick base.
- `real-estate-card-modern-villa-palms`: Modern white flat-roofed villa with timber screens and planted terraces among palm trees under a deep blue sky.
- `real-estate-gallery-kitchen-garden-window`: Warm modern kitchen with cream handleless cabinets, an island with a stool and a large picture window looking onto a palm and flowering trees.
- `real-estate-gallery-master-bedroom`: Calm modern master bedroom with a grey upholstered bed, oak wall panelling, globe pendant lights and sheer curtains (appears to be a photorealistic 3D render).
- `real-estate-hero-addis-skyline-trees`: Addis Ababa high-rise skyline with one tall glass tower rising above a dark band of trees under a wide, calm teal sky.
- `real-estate-hero-modern-apartment-corner-sky`: Low-angle view of the top corner of a contemporary black-and-white mid-rise apartment block with large windows against a pale blue sky (calm sky area top left).
- `salon-about-salon-chair-mirror`: Salon station with a black styling chair, round backlit mirror, wooden vanity and hexagon ceiling lights.
- `salon-about-salon-interior`: Black-and-white view of an empty modern hair salon with arched lit mirrors and styling chairs.
- `salon-card-afro`: Portrait of a Black woman with a full round afro wearing a black jacket against a grey wall.
- `salon-card-barber`: Black barber in gloves and apron trimming a Black client's curly top with a fade in a barbershop.
- `salon-card-braids`: Smiling African woman in a red top having long braids with blue extensions plaited by a stylist's hands.
- `salon-card-manicure`: Close-up of a nail technician working on a client's manicure at a nail table.
- `salon-gallery-serum-bottle`: Unlabelled amber glass dropper bottle on a turned wooden pedestal with palm-leaf shadows.
- `salon-hero-braiding-salon`: Black-and-white photo of two stylists braiding a seated young woman's hair into cornrows inside a salon.
- `salon-hero-natural-curls`: Studio portrait of a young Black woman with voluminous natural curly hair against a soft pink background.
- `school-about-nursery-classroom`: Nursery teacher in a bright African-print top pointing at the alphabet on a chalkboard for small children seated on colourful chairs in a green-walled classroom.
- `school-about-teacher-with-class`: Young woman in a yellow school shirt reading aloud from a booklet in a full classroom of attentive students in uniform.
- `school-card-art-class`: Three young girls with curly hair in aprons painting a rainbow and shapes at a paint-covered wooden table in an art studio.
- `school-card-kindergarten-swing`: Happy little girl with afro puffs in a cream shirt and orange skirt uniform on a playground swing, blue painted wall behind.
- `school-card-primary-boy-desk`: Smiling primary-school boy in a pale blue uniform shirt holding a pen and paper at his desk, classmates blurred behind in a light blue classroom.
- `school-card-stem-robotics`: Three Black girls building a small wheeled robot with blue gears on a round table in a bright white room.
- `school-gallery-girls-uniform`: Close group of smiling young schoolchildren in green and yellow uniforms, two in white and green hijabs, looking at the camera.
- `school-gallery-twin-boys`: Two smiling young boys in green gingham school shirts, one with a backpack, in front of a pale green school wall.
- `school-hero-girls-reading`: Three schoolgirls in blue and purple hijab uniforms reading a book together at a desk in front of a dark chalkboard.
- `school-hero-teacher-whiteboard`: Smiling Black woman teacher beside a whiteboard with a biology diagram while a boy stands at the board and a girl in the foreground raises her hand; bright white classroom.
- `shop-about-loom-weaving-hands`: Over-the-shoulder view of a weaver's hands holding a tape measure over red-and-teal checked cloth on a wooden hand loom.
- `shop-about-spinning-yarn`: An Ethiopian woman in an embroidered grey traditional dress and silver jewellery works thread in her hands in front of a golden field.
- `shop-card-habesha-kemis`: Portrait of an Ethiopian woman wearing a white cotton habesha kemis with black-and-gold tibeb embroidery, silver jewellery and braided hair, green foliage behind.
- `shop-card-jebena-pottery`: A red clay bottle with white hand-painted geometric patterns among glossy black clay jebena coffee pots.
- `shop-card-leather-tote`: A tan hand-stitched leather tote bag hanging from the knobs of a white cupboard.
- `shop-card-woven-scarves`: Four folded hand-woven cotton scarves in blue, tan, pink and purple with white stripes and fringed ends on a white surface.
- `shop-gallery-boutique-rack`: A bright boutique interior with cream and blue dresses hanging from a rope-suspended wooden rail and accessories laid out on white tables.
- `shop-gallery-handwoven-textile`: A hand holding the fringed edge of a white hand-woven cotton cloth with blue patterned bands, a loom blurred behind.
- `shop-hero-habesha-dress-field`: A smiling Ethiopian woman in an embroidered traditional dress and silver jewellery stands between golden mounds of harvested grain under a blue sky (calm area on the left).
- `shop-hero-woven-baskets-wall`: A wall of round coiled woven basket trays, brightly coloured on the left and natural straw on the right.
- `studio-about-photographer-at-work`: A young African woman with an afro photographs outdoors with a DSLR camera in warm light.
- `studio-card-couple-dancing`: A Black bride in an off-shoulder white dress and her groom in a dark suit dance close together at their wedding reception.
- `studio-card-couple-portrait-addis`: An Ethiopian couple dressed all in white, the woman holding a white bouquet, stand side by side in front of a pale roller shutter in Addis Ababa.
- `studio-card-guests-celebrating`: A bride in a white gown dances outdoors at night with groomsmen and bridesmaids celebrating around her.
- `studio-card-hands-wedding-rings`: Close-up of an Ethiopian couple's hands resting on a white wedding dress, both wearing gold wedding rings.
- `studio-card-reception-floral-decor`: A tall pink and peach rose centerpiece stands on a round reception table inside a white event tent set with gold chairs.
- `studio-gallery-bride-getting-ready`: An Ethiopian bride in a white dress holds a white bouquet beside a round mirror in a softly lit room.
- `studio-gallery-decorated-table`: A long wedding table with a white cloth, glassware and white and pink flower arrangements set outdoors among greenery.
- `studio-hero-couple-embrace-garden`: An African groom in a grey suit kisses his bride in a white gown and veil under a flowering tree in a green garden.
- `studio-hero-habesha-bride-cathedral`: An Ethiopian bride in a white embroidered habesha wedding dress and veil sits with her groom in white traditional clothes under a flower arch in front of a cathedral in Addis Ababa.
- `tours-about-men-viewpoint-tree`: Three Ethiopian men in white shawls resting at a viewpoint under a broad-leafed tree, looking over a highland town and valley (Lalibela area).
- `tours-about-pilgrims-red-path`: Men in white cotton shawls talking on a red-earth path between rock walls beside a bright green pool (Lalibela area).
- `tours-card-blue-nile-falls`: Blue Nile Falls (Tis Abay) in full flow surrounded by green forest under a blue sky.
- `tours-card-danakil-dallol`: Yellow, green and rust-coloured sulphur springs and mineral cones at Dallol in the Danakil Depression.
- `tours-card-lalibela-monk`: Monk in a yellow robe reading beside a carved cross-shaped window of a rock-hewn church in Lalibela (portrait).
- `tours-card-simien-escarpment`: Sunlit green terraced escarpments and deep valleys of the Simien Mountains.
- `tours-gallery-gelada`: Gelada with its red chest patch sitting on a rock in front of wildflowers.
- `tours-gallery-gondar-castle`: Fasilides castle in the royal enclosure at Gondar, framed by two tall trees.
- `tours-gallery-salt-caravan`: Long camel salt caravan with herders crossing the cracked salt flats of the Danakil under a wide blue sky (extra; also a strong hero).
- `tours-gallery-spice-market`: Woman in a green headscarf sorting red and green chillies and ginger at an open-air Ethiopian market (extra).
- `tours-hero-highlands-sunset`: Sunset over Ethiopian highland ridges with a road winding through the valley; dark foreground and dramatic blue sky.
- `tours-hero-simien-misty-peaks`: Layered misty rock pinnacles and table mountains of the Ethiopian highlands above a green hill; soft grey sky fills the top third.
- `training-about-teacher-helping-pupils`: A Black woman teacher leans over a desk and points at a pupil's exercise book while two children write.
- `training-card-computer-lab`: African adult students sit at desktop computers in a bright computer lab while an instructor stands at the front.
- `training-card-driving-lesson`: A young Black woman sits at the steering wheel of a car while a man in the passenger seat talks her through driving.
- `training-card-english-class`: A Black woman teacher stands at a whiteboard with English words and letters on it, teaching a student seen from behind.
- `training-card-graduate-diploma`: A smiling African graduate in cap and gown holds a rolled diploma at an outdoor ceremony in Burundi.
- `training-card-students-studying`: Two African students in white school uniforms study a booklet together at a desk in a classroom.
- `training-gallery-group-discussion`: A diverse group of young students, several of them Black, discuss an assignment around a table in a bright room.
- `training-gallery-library-study`: Students work on laptops at long desks in a bright modern library with bookshelves and a staircase.
- `training-hero-instructor-uniformed-class`: An African instructor in a white embroidered shirt speaks to a bright classroom of seated students in beige uniforms in Burkina Faso.
- `training-hero-teacher-whiteboard-class`: A Black woman teacher stands by a whiteboard in a bright classroom while pupils seen from behind listen at their desks.
- `worship-about-priest-candle`: Elderly man in a white turban and purple shawl holding a lit taper candle against a dark stone wall, seen in profile.
- `worship-about-priests-drum-lalibela`: Ethiopian Orthodox priests and deacons in white robes and turbans with prayer staffs, seated on carpets beside a large kebero drum against red rock.
- `worship-card-bible-prayer-hands`: Clasped hands resting on an open Bible on a wooden table (face not shown).
- `worship-card-choir`: African church choir in navy and red robes singing from hymn books on a stage, conductor in the foreground with his back to camera.
- `worship-card-processional-cross`: Close-up of an ornate silver Ethiopian processional cross inside a church, icon painting blurred behind.
- `worship-gallery-congregation-worship`: African congregation standing in worship indoors, a woman in blue with eyes closed and hand raised in the centre.
- `worship-gallery-timkat-drummer`: Smiling boy carrying a kebero drum past a clapping line of white-clad Ethiopian Orthodox choir members at an outdoor festival.
- `worship-hero-golden-dome-church`: Golden domes topped with Ethiopian crosses on a white church rising above green trees under a blue sky.
- `worship-hero-lalibela-st-george`: Rock-hewn Church of St George (Bete Giyorgis), Lalibela, framed by dark red rock walls, with two white-robed men on its steps.
<!-- stock:end -->

## Theme

`theme.primary` (buttons, links), `theme.accent` (dark bands, footer), `theme.background` (light page background), `theme.text`, `theme.highlight` (optional bright fill, never text), `theme.font` (`modern`, `classic`, `friendly`, `elegant`, `grotesk`, `condensed`, `editorial`), `theme.style` (`warm`, `editorial`, `bold`, `clean`, `luxe`, `swiss`, `bento`; see Design and motion), `theme.radius` (`none`, `small`, `medium`, `large`).

- `text` on `background` needs 4.5:1 contrast; `primary` on `background` needs 3:1. Button text colour is picked automatically.
- Pick colours that fit the business (warm browns for coffee, calm teal/blue for clinics, deep green for hotels). Avoid using green, yellow and red together.

## Checking your work

`npm run build` runs the type check, validates `site.json` (JSON syntax, schema and contrast) and prerenders every page. Fix every reported problem; messages name the exact field (`site.pages.0.sections.2.heading: ...`).

## Quality bar

Mobile first (360 px), 16 px minimum text, 44 px touch targets (`.btn` already is), real headings in order, alt text on photos, no horizontal scroll. Code and packages are fixed; you only change content and styles.

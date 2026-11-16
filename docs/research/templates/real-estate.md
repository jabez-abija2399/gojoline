# Real-estate niche brief (agency / developer / apartment sales and rentals)

Method note: pages were fetched as text, so structure, copy, card fields, CTAs and forms below are observed; typeface and colour statements are niche conventions and my own recommendation, not measured from the CSS.

## Sites opened and what I took from each
- **theagencyre.com**: hero headline "Your window to the world's finest real estate" with one italic phrase, BUY / SELL / RENT tabs over one search field; uppercase section labels with a sentence-case subline; listing card = address, "City, Region", bold price ("Call for Price" allowed); contact form asks "Best time to call". Bug seen: unrendered `{{Item.Name}}` tokens: never ship empty card slots.
- **compass.com**: full-width photo, H1 + 2-word subhead, Buy / Rent / Sell segmented toggle and a single input; neighbourhood tiles are just photo + name.
- **knightfrank.co.ke**: "Residential / Commercial" then "Buy / Rent" toggles; featured card = photo, address as title, small "Asking Price" label above "KES 150,000,000", spec row, uppercase "VIEW THIS PROPERTY"; two big category tiles; 5-field "Get in touch" form. Weak: unlabeled spec numbers: always label or icon beds/baths/area.
- **metropolitanaddis.com (Addis)**: hero "Crafted to Perfection" + one button; projects carry status in the name (Selling Now / Sold Out); form titled "LET US CALL YOU" with button "Please Call Me"; short code 9896 plus Ethiopia and USA numbers (diaspora buyers).
- **ayatrealestate.com (Addis)**: stats band (25+ years, 15k+ jobs, 5k+ happy customers); phone, WhatsApp, Telegram, Viber and "Request callback" all present, plus a floating phone button. Weak: anonymous testimonials with placeholder avatars.
- **mividahomes.com (Nairobi)**: project cards with one line "Location | 1, 2 & 3 bed | From KES ..." and status badges Completed / Under Construction / Off-plan / Recently Launched; projects grouped by status; headline "We deliver on time, every time"; six icon benefit tiles.
- **Vide Infra article on 7 Awwwards / CSSDA Site-of-the-Day developer sites** (secondary source): one organising idea per project, palette restricted to two tones taken from the building (evening blue + rose gold), visual + parametric unit selectors. Their WebGL is wrong for slow connections; the restraint is the lesson.
- Failed to load: sothebysrealty.com (405), temerproperties.com (503), ethiopiapropertycentre.com (403), Webflow templates, hauspropertypartners.com (bot check); Framer gallery returned names only.

## Hero pattern
Full-bleed photo (skyline or the flagship building), short headline, one line with city and what is sold. Portals put a search bar here; a small agency with under 30 listings should instead use a segmented filter "Buy / Rent" + area select, or two buttons: "See properties" and "Call us". Developers: project name, "From ETB ...", status, one button.

## Home page order (top to bottom)
1. Header: logo, Properties, Projects, About, Contact, phone button.
2. Hero with Buy / Rent toggle.
3. Featured listings: 3 to 6 cards.
4. Stats band: years, units delivered, families housed, sites.
5. Featured project: large photo, status, 3 facts (location, unit types, handover date), payment-plan line, button.
6. Why us: 3 or 4 icon tiles (title deed verified, on-time delivery, payment plan, diaspora service).
7. About / team photo with named agent and direct phone.
8. Named testimonial.
9. Viewing-request form + office address/map link. Footer with licence number.

## Signature UI
Listing card: 4:3 photo; status badge top-left ("For sale" / "For rent" / "Sold" / "Under construction"); price in bold as the largest text ("ETB 12,500,000", rent with "/ month"; "Price on request" fallback); title; location with pin ("Bole, Addis Ababa"); spec row with icons AND labels: beds, baths, area in m²; whole card tappable; small "Call" and "Telegram" icons on the card. Also: stats band with large numerals, project status chips, payment-plan strip ("30% down, 70% over 24 months").

## Typography
Trust, not romance: sturdy geometric or grotesque sans for everything (Manrope / Inter / DM Sans class), headings 28 to 36 px on mobile, weight 600 to 700; uppercase tracked 11 to 12 px section labels; tabular numerals for prices and stats. Optional serif only for the hero headline on a luxury developer. Amharic: Noto Sans Ethiopic, no uppercase or tracking; test prices and "m²" alignment in both languages.

## Palettes
- **Bole Navy** (corporate, trustworthy): primary navy `#16324F`, dark accent `#0C1C2C`, background `#F5F7F9`, text `#1B2530`; CTA highlight amber `#E0A23A`.
- **Entoto Green** (residential, calm): primary forest `#1F5A46`, dark accent `#12332A`, background `#F7F5EF`, text `#20261F`; highlight terracotta `#C96F4A`.
Badges: For sale = primary, For rent = highlight, Sold = neutral grey.

## Photo style
Bright daylight, straight verticals, blue or pale sky, greenery in frame. Subjects: mid-rise apartment exteriors, a villa, living room, kitchen, bedroom, skyline or neighbourhood view, a team in smart-casual. First photo of each listing is the exterior or the best room. No renders passed off as photos: label them "Artist's impression".

## What converts on mobile
Sticky bottom bar: Call, Telegram, WhatsApp (diaspora buyers use WhatsApp). "Request a viewing" form: name, phone, property (pre-filled), preferred day, call time (morning / afternoon / evening), message optional. A "Let us call you" one-field variant (phone only) converts best. Price always visible without tapping.

## Do
1. Put price, location and beds/baths/m² on every card, with labels.
2. Show a status badge on every listing and project.
3. Offer Buy / Rent as a toggle, not a full search engine.
4. Give a named agent with photo and direct number.
5. State payment plan and handover date for off-plan projects.

## Don't
1. No WebGL, 3D tours or auto-play video on the home page.
2. No anonymous testimonials or stock-avatar reviews.
3. No listings without a price or with empty/placeholder fields; hide the section if there is no data.

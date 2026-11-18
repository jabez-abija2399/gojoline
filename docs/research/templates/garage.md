# Garage niche brief (auto garage, car service and repair / car rental with driver)

Method note: pages were fetched as text on 2026-11-18, so structure, copy, card fields, prices and CTAs below are observed; typeface and colour statements are niche conventions and my own recommendation, not measured from the CSS. Ethiopian garages and rental firms mostly live on 2merkato.com, phone and Telegram; only a few have their own sites.

## Sites opened and what I took from each
- **kwik-fit.com (UK service chain)**: hero is a single "What are you looking for?" field with registration-plate entry and "Or, search by tyre size"; a five-badge trust strip right below (Trustpilot, "open 7 days", certified technicians); service blocks (Tyres, MOT, Servicing, Batteries, Air con, Brakes) each with one line and a link; "Locate A Centre" with "opening hours, contact details and directions"; proof "over 600 centres and 50 years of experience"; price as "from" ("Prices from £221.95"). Weak: offers and Black Friday tiles push the services down.
- **halfords.com full service page (UK service chain)**: three named tiers with when to use them ("every 6 months or 6,000 miles" / "annual… every 12,000 miles" / Major), each tier = previous tier + listed extras; "A Halfords full service is a 76-point inspection"; warranty in one sentence: "2-year or 24,000-mile guarantee on parts and work (whichever is sooner)"; "Price based on your nearest garage". Weak: two different "from" prices on the same page; never let that happen.
- **repairpal.com (US repair marketplace)**: "Quality Car Repair. Fair Price Guarantee."; "Select vehicle make" dropdown + "Find Repair Location"; trust explained as three checks (mechanics and tools assessed, past customers surveyed, repair orders reviewed for fair pricing); popular estimates as links named "make model + repair + Cost".
- **tehetnagarage.vercel.app (Addis, diagnostic garage)**: 25+ services filterable by category chips (Inspection, Electric Vehicle, Engine, Electrical, Brakes…); "Book This Service" on each row opens a phone call; "Enquire About Parts"; WhatsApp icon and "Review Us on Google"; hours "Mon–Sat: 9AM – 6PM"; EV services listed as a category, which matters as EVs grow in Addis. Weak: no prices, English only, no form.
- **marathoncars.com after-sales (Addis, Hyundai dealer workshop)**: booking by phone or email ("send an email… we will reply with service specifics and an appointment date"); one number per branch (Saris, Megenagna, Hawassa); hours "Mon–Fri, 08:00–17:00"; promise "factory-trained technicians", "Genuine Hyundai Parts". Weak: one branch number left blank ("+251").
- **cargebeya.com guide to Addis garages**: garages cluster by area (Kera, Kality, Mesalemiya, Haya Hulet, Megenagna) so the area name is a trust signal; customers look for "computerized diagnostic" and brand specialism ("Land Rover, BMW, Ford… also Toyota"); the yearly Annual Technical Inspection is a service people search for.
- **2merkato.com — Amazon Car Rental PLC (Addis)**: fleet named by model ("TOYOTA LAND CRUISER, RAV 4, MARK II"), plus minibuses and Coaster buses for groups; "driven by professional Ethiopian Driver/ guides"; three phone numbers; office and garage in Lideta. No rates.
- **2merkato.com — Ella Car Rent (Bole)**: long fleet list in local vocabulary (Land Cruiser "Long Base, V8, Cobra, 105", Pickup, High Roof, Minibus, Coaster, Corolla, Vitz, Yaris, Suzuki Dzire); "Airport transfers" as a service; landmark address "adjacent to Adey Abeba Stadium". No prices, no hours.
- **greenmotion.com — Addis Ababa Bole Airport**: location described by landmark and time ("Bole Airport Road… just a 3-minute drive from the airport"); booking fields pick-up/drop-off place, date and time, age band "Aged between 30 - 65", promo code; checklist of documents (licence, passport, card); local driving rules (right-hand traffic, IDP, 50/80/100 km/h). Weak: no fleet cards, no hours.
- **shoortravel.com (Nairobi car hire with driver)**: one card per vehicle type with seats ("Land Cruiser… seats 7", "Coaster… 25 to 33 seater"), price as "US$ 259 per day", inclusions spelled out ("driver-guide and his allowances, fuel, and taxes"), self-drive explicitly not offered, peak-date surcharge stated, multi-day discount ("special rate for hire of at least 3 days"), "Enquire" per card. Weak: prices still labelled 2019.
- **africanspicesafaris.com car hire (East Africa)**: labelled spec rows on each card ("Seating Capacity :", "Transmission :", "Engine by CC :", "Basic Rental : From 35 US Dollars Per Day"); offers both "chauffeur-driven and self-drive"; "free delivery to major airports or hotels"; contact by call, text or WhatsApp. Weak: "Full Details" link goes nowhere; inconsistent price wording across cards.
- **enterprise.com**: "Meet the Fleet" by class (Compact, SUV, Minivan, Pickup, Cargo Van) with "View All Vehicles"; "Start a Reservation" and "Find a Location" as the two first actions.
- Refused or empty: fixter.co.uk, sixt.com (403); bookmygarage.com (429); hertz.com Nairobi location (title only); service4service.co.uk redirected elsewhere, not followed. Not used.

## Hero pattern
Text-led on a dark band with one real photo (workshop bay with a car on the lift, or the rental fleet lined up). Eyebrow: area + specialism ("Kality, Addis Ababa · Toyota & Hyundai · Since 2010"). Headline 5–8 words of outcome ("Honest repairs, ready the same day" / rental: "Cars with driver, from the airport to anywhere"). One proof line ("Computer diagnosis · 6-month warranty · Mon–Sat 8:00–18:00"). Primary button "Book a service" (rental: "Book a car"), secondary "Call". For garages, the first form field can sit in the hero: "Car make and model" select + "Continue".

## Home page order (top to bottom)
Garage:
1. Header: logo, Services, Prices, About, Contact, phone button.
2. Hero.
3. Trust strip: 3–4 badges (years, cars serviced, warranty, open days).
4. Service price list: grouped (Maintenance, Engine, Brakes & suspension, Electrical & diagnosis, Body & paint, AC, Inspection), "from" prices.
5. Makes we specialise in: text chips (Toyota, Hyundai, Suzuki, Isuzu, EV).
6. How it works: book → drop off or pickup → diagnosis and price confirmed by Telegram before work → collect.
7. Warranty & parts block.
8. Named reviews.
9. Booking form, then map, hours, phone.
Rental:
1. Header. 2. Hero. 3. Fleet cards. 4. With-driver / self-drive explainer and inclusions. 5. Airport pickup block. 6. Long-term and corporate/NGO hire. 7. Requirements (documents, deposit). 8. Reviews. 9. Booking form + office map + hours.
A business that does both shows Services first, then Fleet, with one combined form that switches by tab.

## Signature UI
- **Service price row**: name, one-line scope, time estimate, "from ETB —" right-aligned in tabular numerals ("Oil and filter change · 45 min · from ETB —"; "Computer diagnosis · 30 min · from ETB —"). Parts-dependent jobs say "price after inspection". Prices stored as integer minor units.
- **Service tiers** (Basic / Full / Major) where each tier lists only what it adds, with interval in km ("every 5,000 km").
- **Booking form**: service (select, pre-filled from the row tapped), car make (select), model, year, plate number (Ethiopian format: region code + code number + digits, free text), preferred date, morning / afternoon, pickup from home yes/no, name, phone, note. Sends to Telegram.
- **Fleet card**: photo on plain background, model ("Toyota Land Cruiser V8"), seats, transmission, fuel, a two-option toggle "Self-drive / With driver" that swaps the daily rate ("ETB — / day"), inclusions line ("Driver, fuel in city, 10 hours/day"), "Book" button. Multi-day discount as small text.
- **Rental booking form**: car (pre-filled), with driver yes/no, pick-up place (Bole airport / hotel / office), pick-up date and time, return date, flight number (shown when airport is chosen), passengers, trip (in Addis / out of town with destination), name, phone (Telegram/WhatsApp).
- **Airport pickup block**: "Meet at Bole arrivals with a name sign", flight tracked, wait time, fixed transfer price.
- **Warranty card**: duration + distance ("6 months or 10,000 km, whichever is first"), what it covers (parts and labour), genuine/OEM parts note, old parts returned on request.
- **Map + hours card**: landmark address ("behind Kality Total station"), today's hours highlighted, "Open now" chip.

## Typography
Mechanical and confident: a sturdy grotesque or slightly condensed sans for headings (Barlow Semi Condensed / Archivo / Manrope class) at 600–700, Inter or Noto Sans body 16 px. Tabular numerals for prices, km and times. Plate numbers and model codes in a mono or tabular style. Hero 32–36 px at 360 px, 52–64 px desktop. Amharic: Noto Sans Ethiopic, weight contrast only, no uppercase labels; test "ETB / ቀን" and long service names (የሞተር ዘይት መቀየር) in the price column.

## Palettes
- **Workshop Red** (garage): primary red `#C62828`, dark accent `#1C1F24`, background `#F4F5F6`, text `#15181C`; amber `#F5A623` for warranty and "open now".
- **Road Blue** (rental, airport): primary blue `#1F4E9C`, dark accent `#0E1E38`, background `#F5F7FA`, text `#121826`; highlight green `#2E8B57` for "With driver" and availability.
Red only for buttons and key prices, never for whole sections.

## Photo style
Garage: a clean bay with a car on the lift, mechanic using a diagnostic tablet, close-up of brake parts in hands, the front of the garage with its sign so people recognise it on arrival. Rental: each car photographed in the same spot, 3/4 front angle, daylight, plain wall behind; one shot of a driver in uniform at Bole arrivals. 4:3, under 120 KB. No stock supercars or showroom renders.

## What converts on mobile
- Sticky bottom bar: Call, Telegram, "Book".
- Tap a service or car → the form opens with it pre-filled.
- Price visible on every row and card without tapping; rental rate updates when the With driver toggle changes.
- "We confirm the final price on Telegram before starting work" in the booking area: it removes the fear of surprise bills.
- Map link, landmark address and today's hours next to the form; airport pickup reachable in one tap for visitors and diaspora.

## Do
1. Put a "from" price or daily rate on every service and car, with what is included.
2. Ask for make, model and plate in the booking form so the owner can prepare parts.
3. State the warranty in one sentence with time and km.
4. Show with-driver and self-drive as two clear prices, plus driver hours and out-of-town terms.
5. Give a landmark address, map link and opening hours on the home page.

## Don't
1. No online card payment or deposit capture; bookings are requests confirmed on Telegram, paid in Birr.
2. No buttons that lead nowhere ("Full Details" to `#`) or blank phone numbers; hide the field if empty.
3. No conflicting prices for the same service, and no undated old rates.

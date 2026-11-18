# Pharmacy / drug store / medical supplies — design brief

Researched 2026-11-18. Separate from `clinic.md`: a clinic sells appointments with named doctors; a pharmacy answers "are you open right now?", "do you have it?" and "can a pharmacist tell me what to take?". The template is built around hours, stock enquiry and advice, not booking.

## Sites opened and what I took
- **capsule.com** (US delivery pharmacy) — Hero "Meds made easy" + one sentence ("delivers your prescriptions, the same day, for free—all from your phone") + "Get Started". Second block is a delivery checker ("Check if we deliver to you", one zip field + Submit). Three feature cards: same-day delivery, private chat or text with pharmacists, manage medicines from your phone. Price stated plainly ("Capsule is free. Just pay your copay."). 4.9 rating, FAQ ("Still have questions?"), help phone number in the footer as a tap-to-call link.
- **mydawa.com** (Kenya) — Search box "What Are You Looking For?" with recent and trending searches. "Shop by Category / by Condition / by Brand". Two service buttons under "Get Started": "Speak to a Doctor" and "Upload a Prescription". Branch names in the top strip (Westlands, Mombasa CBD, Adams Arcade…). Weakness: no licence statement or contact on the visible page, and a deals banner ("1012 deals live… Up to 75% off") leads the hero.
- **goodlife.co.ke** (Kenya, "150+ stores") — Free-delivery threshold in the top line ("Free Delivery For orders above 2,500/="); same-day delivery for orders "by 7 pm"; "WhatsApp Us" at the top; "Online Consultation with Pharmacist… Expert pharmacy advice, anytime online". Prescription privacy line: "To ensure the security of your data we are currently taking prescriptions via WhatsApp only", with a privacy-policy tick before submit. Pay on delivery accepted. Weakness: no opening hours, no licence number.
- **medplusnig.com** (Nigeria) — Four trust chips as the first thing on the page: "Nationwide Delivery", "NAFDAC-Approved Products Only", "Licensed Pharmacists On Call". Upload tile: "Upload it and we'll prepare your order—our pharmacists will verify & dispense it", JPEG/PDF/PNG up to 3 MB. A "stores running 24 hours" list: five Lagos branches each tagged "Open 24 hrs" with phone and "Directions". "Talk to Pharmacist — Get medication advice" with "Get On A Call →". WhatsApp used for "Report Adverse Drug Reactions".
- **healthplusnigeria.com** (Nigeria) — "Welcome to Nigeria's first integrative E-Pharmacy!"; seven category tiles (Pain Management, Cough & Cold, Chronic Diseases, Vitamins & Supplements, Reproductive Health, Medical Accessories, Other Ailments); floating "Chat with us" WhatsApp button; health tools ("Check Your BMI Now", "Know your Numbers"); the responsible pharmacist named in the footer ("Superintendent: Pharm. …"). Weakness: no store hours on the home page.
- **prairievillepharmacy.com** (US independent) — "Fill Better With Us!"; phone in the header and repeated in four places; hours block titled "Come Visit" ("Mon - Fri: 8:30am-6:30pm Sat: 9am-1pm Sun: Closed") placed third, straight after the welcome; "Transfers and Refills" handled by "get in touch directly". Weakness: shop grid still shows template placeholders ("I'm a product").
- **williamsburgdrug.com** (US independent) — Heritage as the headline: "Williamsburg's Trusted Independent Pharmacy Since 1895". Six speciality cards with "Learn more"; named team; reviews with owner replies; phone numbers labelled by purpose (Compound Prescriptions / Retail Prescriptions / Fax); hours in the footer (Mon–Fri 9–6, Sat 9–1, Sun closed). Weakness: no phone in the header.
- **northfultonpharmacy.com** (US independent) — "Open today 09:00 am – 06:00 pm" status line; services written as concrete promises: "Free Delivery Service (within a 5 mile radius)", "24/7 Emergency Contact Line", compression-stocking fittings. "Get directions" link. Weakness: no hero button at all.
- **walgreens.com** — Pharmacy tasks are tiles ("Manage prescriptions", "Refills", "Pharmacy Chat" under More Services) rather than the hero; the hero is a promotion. Lesson: chains bury the pharmacy behind retail; a small pharmacy should lead with it.
- **faastpharmacy.com** — Counter-example. Prescription-only medicines with prices on the home page ("from $ 0.50"), "Free Bonus Pills", "DISCREET PACKAGING", certifications claimed without numbers, delivery "2 and 4 weeks". Every one of these is a rogue-pharmacy signal; the template must look like the opposite.
- **drogapharma.com** (Addis Ababa importer, parent of Droga Pharmacies, the largest private retail chain per directory listings) — "Serving The People!" hero with only "Learn More"; mission and HQ text before anything useful; ISO 9001:2015 badge and several phone numbers in the footer; no hours. Its retail site **drogapharmacy.com** returned only a page title.
- **map.et — Abyssinia Pharmacy** (Nefas Silk, Addis) — The listing is what most Addis pharmacies have instead of a website: name, sub-city, coordinates, plus code, "Mo-Sa 08:00-18:00", no phone, no photo. The template should beat this in one screen.
- **shega.co — Medhanite** (Addis) — App launched July 2022 for "finding medications in Addis Ababa", onboarded 150 pharmacies. Shows the local pain: people phone round pharmacies to find a medicine. Hence the stock-enquiry form.
- Refused or empty: boots.com (empty body), goodrx.com and costplusdrugs.com (403), alto.com (redirects to another domain, not followed), mpharma.com (503), chemist4u.com (425), drogapharmacy.com (title only), thereporterethiopia.com (empty body); myduapharmacy.com and pillwise.co.uk did not resolve. Not used.

## Ethiopian regulation (what the template must respect)
Read from the scanned Proclamation No. 1112/2019 (Food and Medicine Administration Proclamation, Federal Negarit Gazette, Feb 2019) and EFDA documents. This is a design constraint, not legal advice; the owner confirms with EFDA or the regional health bureau.
- **Art. 59(1):** "Unless subject to exceptions defined under a directive issued by the executive organ, it shall be illegal to advertise any medicine through a means of advertisement dissemination." Art. 58(1): any advertisement of a regulated product must not be false or misleading. Art. 59(4): no advertising of medicines or devices inside a health institution without permission.
- **Art. 23–24:** a medicine institution must be licensed by EFDA or the regional health regulator, the certificate of competence cannot be transferred, and it must employ a registered, competent health professional.
- **Two outlet tiers:** pharmacy and drug shop. EFDA's *List of Medicines for Drug Shop* (5th ed., Oct 2021) limits what a drug shop may stock, and its dispensing guidance says filled prescriptions are kept at least 2 years and lists "dispensing antimicrobials without prescription" as a driver of resistance.
- EFDA approved new pharmacy service standards (reported by 2merkato, Mar 2024; text not found), and a 2025 directive tightens control of narcotic/psychotropic medicines (Addis Fortune); neither text was readable online.
- **Template consequences:** advertise the outlet and its services, never a medicine. No medicine names, brands or prices anywhere (prescription-only or not). The product section shows categories of non-medicine health goods only (baby care, skin care, vitamins, BP monitors, glucometers, first aid, mobility aids, medical supplies), and the AI refuses to add medicine names or prices. Licence/certificate number, outlet type and responsible pharmacist's name are required fields shown in the footer and the About block. Do not use the red cross emblem (protected); use a green cross, pill or mortar mark from `brand/`.

## Hero pattern
Status-led, not slogan-led. First line is a live pill: "● Open now · closes 21:00" (green) or "Closed · opens 08:00" (grey), plus an amber "On duty tonight" badge when the owner switches it on from Telegram. Headline 4–8 words naming the place and the promise ("Your neighbourhood pharmacy in Piassa", "Pharmacist advice and health supplies, Bole"). One sub-line: services + delivery area ("Pharmacist advice · stock check by Telegram · delivery in Bole and CMC"). Two buttons: primary **Ask if it's in stock** (opens the enquiry sheet) and secondary **Call 09XX XXX XXX** (tel:). No photo needed above the fold on mobile; on desktop a real shelf/counter photo on the right.

## Home page order
1. Top strip: hours today · on-duty badge · phone
2. Header: logo, Services, Health products, Delivery, Find us; Call button
3. Hero (above)
4. Quick actions (4 tiles, 2×2): Ask about stock · Send a prescription (optional) · Talk to the pharmacist · Delivery
5. Opening hours table, today highlighted; night/on-duty note; public-holiday line
6. Services list: pharmacist advice, blood pressure / sugar check, medicine review for elderly, home delivery, medical supplies for clinics, ordering items not in stock
7. Health products: 6–8 category tiles (icon + name, no medicine names, no prices on medicines; "from … Birr" allowed only for non-medicine goods)
8. Meet the pharmacist: photo, name, qualification, languages, licence/registration line
9. How a prescription enquiry works: 3 steps (send photo → pharmacist checks and replies on Telegram → pick up or delivery, pay in Birr on collection/delivery)
10. Delivery: areas served, fee in Birr, hours, "pay cash or mobile money on delivery"
11. FAQ: do I need a prescription, what happens to my photo, do you deliver at night, which payment methods
12. Find us: map link, landmark directions ("opposite … church"), plus code
13. Footer: licence/certificate number, outlet type, responsible pharmacist, Telegram, phone, "Report a problem" link

## Signature UI
- Open/closed pill computed from the hours table in Africa/Addis_Ababa time (Ethiopian clock shown in Amharic: "ከጠዋቱ 2:00" alongside 08:00)
- "On duty tonight" amber badge the owner toggles from the Telegram bot
- Stock-enquiry sheet: item name (free text), optional photo of the box, quantity, phone; sends to Telegram; reply promise "We reply within 15 minutes while open"
- Prescription upload as an optional step with a lock icon and plain privacy line; image compressed on the phone to ~300 KB before upload
- Category tiles with line icons (no product photos needed)
- Pharmacist card with licence line
- Delivery-area chips (Bole, CMC, Megenagna…) and a flat fee

## Prescription upload: optional and private
Never required to enquire. Copy: "Optional. Only our pharmacist sees this photo. It goes straight to our Telegram and is not shown on this site." Tick box for consent; no account needed. The site does not keep the image after delivery to Telegram (store nothing public; delete from our storage after forwarding). Accept camera photo or gallery, JPEG/PNG/PDF, compressed client-side; show a progress bar and a retry on slow data. The pharmacist decides; the page never promises that a medicine will be supplied.

## Typography
Clear humanist sans (Noto Sans Ethiopic for Amharic paired with Inter or Source Sans 3), sentence case, headings 600 weight. Hours and phone numbers are the largest text after the headline: 20–24px, tabular figures. Hero 30–34px at 360px, 44–52px desktop. Body 16–17px, line height 1.6. Status pill 14px bold. No condensed or decorative fonts: the audience includes older people reading in a shop doorway. Amharic: weight contrast only, no uppercase or tracking.

## Palettes
- **Pharmacy green (default)**: primary `#15803D`, dark accent `#0E3B22`, light background `#F3FAF5`, text `#13201A` (on-duty amber `#F59E0B`, closed grey `#6B7280`)
- **Plum and mint (beauty, mother & baby, supplies-led stores)**: primary `#7A2E8E`, dark accent `#3B1544`, light background `#FAF6FB`, text `#1E1622` (mint `#2FB58F` for the open pill)
Both are deliberately distinct from the clinic template's teal and blue.

## Photo style
Real counter and shelves, tidy and bright; the pharmacist in a white coat talking to a customer across the counter; hands handing over a bag; a delivery rider outside the shop; the shop front with its sign so people recognise it. Square or 4:3, one photo per section at most. No close-ups of pill blisters with readable brand names, no syringes, no stock imagery of foreign chains.

## What converts on mobile
- Sticky bottom bar: **Ask about stock** (Telegram sheet) + **Call**
- Open/closed status visible without scrolling
- Stock enquiry in 2 fields (item, phone); photo optional
- Directions with a landmark sentence, not only a map pin
- Delivery fee and area stated before the enquiry, so nobody is surprised
- Page under 300 KB on first load; icons as inline SVG, one photo lazy-loaded

## Do
1. Show today's hours, open/closed and the on-duty status in the first screen.
2. Make "is it in stock?" a two-field form that lands in the owner's Telegram.
3. Put the licence number, outlet type and named pharmacist on the page.
4. Keep prescription upload optional, private and explained in one sentence.
5. Sell the service (advice, checks, delivery, supplies), not individual medicines.

## Don't
1. No medicine names, brands or prices; no "discount", "bonus pills" or "no prescription needed" language.
2. No red cross emblem, no carousel of promotions, no welcome/mission essay before hours.
3. No required account or upload to ask a question; no public gallery of customer prescriptions.

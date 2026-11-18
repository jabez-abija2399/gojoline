# Fashion (boutique, habesha kemis maker, tailor, small clothing brand): design brief

Method note: pages were read as extracted text (structure, copy, CTAs) on 2026-11-18. CSS was not available, so typography and hex values are my recommendations, not scraped values. Refused or empty: sezane.com and thereformation.com (403), tailorstore.com (403), suitsupply.com custom-made (redirect loop, then an empty shell with only navigation), yefikirdesign.com and proper-cloth.com (did not resolve). A MINAB storefront on vercel.app turned out to be a demo with sample data and was not used. This brief complements `shop.md` (general goods); here the stress is on sizes, made-to-measure, occasion seasons and diaspora shipping.

## Sites opened and what I took
- **Lemlem** (lemlem.com, Ethiopian-made resort wear): top bar carries the season ("Resort 2027 | Discover the Latest Collection") plus the shipping promise ("We ship globally"); 3-word hero "Luxury Woven In" with one button "Shop the new collection"; three category tiles (Swimwear, Ready to wear, Accessories) each "Shop now". Product card = "REKKA | String Bottom", price, colour swatches with "+N", **size row XS to XL right on the card**, "Select a size" and "Notify me" for missing sizes. Country/currency selector in the header ("United States (USD)").
- **TheEthiopianStore** (ethiopian.store, habesha kemis sold to the diaspora): no hero copy beyond a sale line ("Up To 55% OFF"); the home page is a stack of **occasion rails**: "Best Selling Habesha Dresses", "On A Budget", "Church Dresses", "Habesha Wedding Dresses", "Wedding Guest Habesha Dresses", "Celebrations & Holidays", "Ashenda Dresses", plus men's and couples. Card = photo, "Sale" badge, struck price, "Free shipping". Trust row "Custom Sizing · Easy returns · Fast & Free shipping"; "Happy Customers … from 134 reviews". Product page: sizes XS-XXL, **"Estimated delivery: 5 weeks"**, "Includes a matching Netela", WhatsApp + email contact, yet no measurement fields and no size chart despite "customized to your size": the gap Gojoline should close.
- **Canary ሐበሻ** (canaryhabesha.odoo.com, habesha clothing house): bilingual name in the logo; banner "We Ship Worldwide"; six collection cards (Women's, Men's, Couples, Family & Kids, Home decor, Jewelry) with "View Collection"; testimonials do the made-to-measure selling ("I live abroad and ordered a custom outfit with just my measurements. It fit like a glove."); ordering is a contact form (name, phone, email, **country**, subject) plus WhatsApp and a +251 number. No prices anywhere: the weak point.
- **MAFI MAFI** (mafimafiet.com, Addis designer): editorial, image-first; collection name as the hero ("YALTOPYA") with one button "Shop new collection"; nav Story · Shop · Impact · Archives · Contact; **press logo row** (Vogue Italia, Forbes Africa, Bon Appétit). No prices or ordering on the home page: good mood, poor conversion.
- **Sabahar** (sabahar.com, Addis handweaving): "Handcrafted Ethiopian textiles" + "Shop now"; intro sentence on natural materials and artisans; "Browse by collection" with one-line descriptions per tile ("Scarves, shawls, jackets, capes, kaftans and bags"); "Our process / Our story" pair; footer line "For over 20 years … woman-owned Fair Trade business based in Ethiopia"; separate "Ethiopia Shop" link for local buyers vs the US store.
- **Nathan Tailors** (nathantailors.com/en/online-tailor, Hoi An tailor selling worldwide): the best made-to-measure model found. Headline "How ordering a custom suit online actually works"; **five numbered steps**: Design (choose cloth over WhatsApp) → Measure ("20 minutes, guided", 13 men / 15 women measurements with diagrams, plus height, weight, three photos) → Review (tailor checks numbers against photos, optional video call) → Cut and sew ("3-4 working days", progress photos) → Verify and ship (**finished garment photographed with a tape laid on it**, approve before shipping). Price range stated up front ("$169 to $459"), timing "about 3 weeks door-to-door", CTAs "Talk to a tailor" / "Message us on WhatsApp", reply time "usually within the hour".
- **Christy Dawn** (christydawn.com, DTC dresses): one hero dress in many prints; card = name ("The Dawn Dress Apple Harvest"), "Available in 12 colors", price $198, fabric icon (regenerative / organic cotton), sizes XS-XXL and a separate **Petites** range; footer help: Size Guide, Shipping/Returns, Garment Care.
- **Everlane** (everlane.com): hero with two split CTAs "Shop women / Shop men"; brand line "Responsibly crafted … designed to last. At prices that make sense."; "Everyone's Obsessed" bestseller rail; "#EverlaneOnYou" **customer-photo grid**; cart note "$75.00 away from free express shipping"; "30-Day Easy Returns".
- **Toast** (toa.st): calm editorial voice ("Moments of Light"); top bar states delivery and returns in one line ("Free UK delivery on full price orders over £150. Free UK returns."); footer "Help" group leads with Delivery & Collection, Returns, **Size & Fit**, Help With Ordering.

## Hero pattern
One portrait-leaning photo of a garment worn by a real person (4:5 on mobile, text below the photo, not on it). Eyebrow with craft and place ("Handwoven · Shiro Meda, Addis Ababa"), 3-6 word headline naming the product or collection ("Kemis for Timkat, made to fit"), one line on how it is made and how long it takes, two buttons: primary "See dresses", secondary "Order made-to-measure". Under the hero a **thin promise strip**: "Made to your measurements · Addis delivery 1-2 days · We ship worldwide". Seasonal collection name can replace the headline (Lemlem, MAFI MAFI) when the owner has one.

## Home page order
1. Header: name, language switch (EN / አማ), currency note only if they ship abroad, one button (Telegram).
2. Hero + promise strip.
3. Occasion tiles: 4 square tiles (Wedding, Church & holiday, Everyday / modern, Men & couples). Occasions sell habesha clothing better than garment types.
4. Featured pieces: 2-column grid of cards (photo, name, price in Birr, sizes or "Made to measure" tag).
5. Made-to-measure: 4 numbered steps (choose style → send measurements → we sew and send photos → pick up or ship) with lead time and price "from".
6. Next-holiday banner: "Order by 20 December for Genna" with a countdown in days (text only, no live timer).
7. Fabric and craft: photo of the loom or tibeb border, 3 sentences, one number ("1 dress = 3 weeks of weaving").
8. Customer photos: 4-6 real wearers, name and city ("Hanna, Washington DC"), which also proves the diaspora shipping.
9. Delivery and payment: Addis, regions, abroad; Telebirr, bank transfer; exchange/alteration policy.
10. Visit / fitting: address, map, hours, "fittings by appointment".
11. Footer: size guide, delivery, contact, socials, report-abuse link.

## Pages
- **Home** (above).
- **Collection / catalogue**: filter chips by occasion and by "Ready to wear / Made to measure"; 2-column grid; no infinite scroll, numbered "Show more" batches of 12.
- **Product**: photo gallery (front, back, tibeb detail, worn), name, price in Birr, size chips, "Includes netela" type extras, fabric and care, lead time, two buttons "Order on Telegram" and "Order made-to-measure". Size chart opens inline, not as a PDF.
- **Made-to-measure**: steps, measurement form with diagrams, price list "from", lead times per item.
- **Size guide**: one table (XS-XXL against bust/waist/hip/length in cm with inches toggle) plus a "how to measure" diagram.
- **Delivery & payment**: zones, prices, times; international carriers; what to do on arrival (customs).
- **About**: maker, workshop, weavers.

## Signature UI
- **Product card**: 4:5 photo, name, price "4,800 Br" bold and tabular, size chips (S M L XL) or a "Made to measure" pill, optional "Ready in 3 weeks" line. Tapping "Order" opens Telegram with "Order: Tilet kemis #K-014, size M" pre-filled.
- **Measurement form**: one measurement per row with a small line diagram (bust, waist, hip, shoulder width, sleeve length, upper arm, shoulder-to-floor length, height), cm/in toggle that remembers the choice, optional 2 photos (front, side), notes, delivery date wanted. Submits as a Telegram message to the owner and a summary the buyer can screenshot.
- **Lead-time line** on every made item ("Ready in 10 days · ship abroad +5-8 days"), and a "need it by" date field that warns when the date is too close.
- **Proof-before-shipping**: on the made-to-measure page, a photo of a finished dress with a tape measure laid on it (Nathan Tailors) as the promise "we send you photos before we ship".
- **Occasion tiles and holiday banner** with Ethiopian date and Gregorian date side by side.
- Size chips that grey out with "Ask on Telegram" when a size is not in stock, never a dead "Sold out" page.

## Order flow (no card checkout)
1. Buyer picks size or fills measurements, taps "Order on Telegram" (or "Send order" which posts the form to the owner's Telegram via Gojoline).
2. Owner confirms price, lead time and delivery cost in chat.
3. Deposit (typically 50% for made-to-measure) by Telebirr or bank transfer (CBE / Awash / Dashen account shown as copyable text); diaspora can pay by bank transfer abroad or have a relative pay in Birr in Addis. Show this as text, not as a payment widget.
4. Owner sends progress / finished photos; buyer approves; balance paid; pickup, Addis delivery, regional bus/courier, or international courier (EMS via Ethiopian Postal Service, DHL).
Show prices in Birr. If the owner sells abroad, let them set a separate fixed USD/EUR price per item instead of auto-converting (rates move; money stays integer minor units + currency).

## Typography
Fashion needs contrast: a high-contrast serif for headings (Cormorant Garamond or Playfair Display; for Amharic, Noto Serif Ethiopic), sentence case, 32-38px at 360px and 56-64px desktop, leading 1.1 Latin / 1.35 Ethiopic. Body and UI in a quiet sans (Inter or DM Sans; Noto Sans Ethiopic) 16px. Prices and measurements tabular. Labels (sizes, "Made to measure") 12px caps with 0.1em tracking for Latin only; never uppercase or track Ethiopic. A tailor or menswear brand can use sans everywhere (Manrope, medium weight).

## Palettes
1. **Kemis (cotton white, wine and tibeb gold)**: primary #6B2737, dark accent #2A1418, light background #FBF8F3, text #2B2326. Optional highlight #C9A227 for the tibeb line and holiday banner only.
2. **Atelier (ink and chalk, for tailors and modern labels)**: primary #2D3A4A, dark accent #121820, light background #F4F2EE, text #1C1F23. Optional highlight #B5562F for the made-to-measure pill.
Keep backgrounds warm-white: habesha kemis is mostly white cotton and disappears on pure #FFFFFF; a slightly warm background gives the fabric an edge.

## Photo style
Worn, full length, 4:5, real people of varied ages and body sizes; daylight against a plain wall, church steps or courtyard. Detail crop of every tibeb border (it is what buyers compare). Flat-lays only for netela and accessories. Workshop shots: loom, hands at the sewing machine, tape measure. Same crop and background per grid. No studio-white cut-outs for kemis (the white dress vanishes), no heavy filters that shift fabric colour.

## Amharic notes
- Common words to use as-is: ሀበሻ ቀሚስ (habesha kemis), ጥበብ (tibeb), ነጠላ (netela), ጋቢ, ልክ (size/measure), በልክ የሚሰፋ (made to measure). Measurement labels must be short in both languages (ደረት, ወገብ, ዳሌ, ትከሻ, የእጅጌ ርዝመት, ቁመት).
- Show holiday deadlines in both calendars ("ታኅሣሥ 11 / 20 December").
- Ethiopic headlines run longer and taller: test the hero and card names at 360px; let card names wrap to 2 lines with equal card heights.

## What converts on mobile
- "Order on Telegram" on every card with product and size pre-filled; sticky bottom bar: Telegram, Call, Measurements.
- Price, sizes and lead time visible without opening the product.
- Measurement form one field per row, numeric keypad, cm/in toggle, autosaved draft (localStorage) so a dropped connection does not lose 8 numbers.
- Delivery promise (Addis / regions / abroad) in the first two screens.
- Images 4:5 at 720px wide under ~100 KB, lazy-loaded; no video hero.

## Do
1. Price every piece in Birr; say "from" for made-to-measure and give the lead time.
2. Organise by occasion (wedding, church, holiday, everyday), and put the next holiday's order-by date on the home page.
3. Give a real size chart in cm and inches and a measuring diagram.
4. Promise and show photos before shipping, especially for diaspora orders.
5. State international shipping cost and time honestly, and that customs is the buyer's responsibility.

## Don't
1. No "Sold out" dead ends: offer "make it for me" or "ask on Telegram".
2. No fake cart or card checkout; the order is a Telegram message plus Telebirr/bank transfer.
3. No editorial-only home page without prices (the MAFI MAFI / Canary gap), and no sliders or autoplay lookbook videos.

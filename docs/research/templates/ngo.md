# NGO / charity / community organisation template brief

Method note: pages were read with a text fetcher, so section order, copy and labels are observed; typography, colour and photo remarks are design judgement and recommendation, not measured from the pages.

## Sites opened and what each gave

- **givedirectly.org**: hero headline is the whole proposition: "Send money directly to people who need it most." + one sentence. Donation widget sits in the hero (once/monthly toggle, three amounts, default button "Give $60 monthly"). Then "Why cash?" as four one-word cards each with one number (Simple 85%, Proven 1,000+ studies, Respectful 90%, Transformative 2.5x); press logos; "Trusted by" funder logos; five recipient stories with a name, country and a concrete outcome ("Francoise started a sewing business and is returning to school"); impact counters ("2,275,381 people reached", ">87% of funds delivered"); closing CTA "Help someone live a life as full as your own". They also publish "Sharing stories of poverty but not 'poverty porn'".
- **charitywater.org**: hero "Bring clean and safe water to every person on the planet" + single button "GIVE TODAY"; "Because clean water changes everything" (four themes: Health, Education, Women, Economic Growth); proof promise "Give water. Get proof." (GPS + photos per project); three impact numbers (projects funded, countries, people served); eight "Ready to take action?" cards; charity-rating badges in the footer.
- **doctorswithoutborders.org**: urgent banner; hero is a current field story with photo credit and two buttons ("Learn more", "Support our global work"); mission sentence; tabbed **"Our reach / How we use funds"** (70+ countries, 17,071,300 consultations; 84% programmes, 15% fundraising, 1% admin); latest stories; principles list; "How you can help" (fundraise, attend, give monthly).
- **hamlin.org.au** (Hamlin Fistula Ethiopia): hero "We have one goal: Eradicate obstetric fistula. Forever." with "Learn more" + "Donate"; three promo tiles; plain-language problem numbers ("over 82,000 Ethiopian women" helped; 22,000 still untreated); founders' story since 1959; counters (patients treated, midwives graduated, years of service, Ethiopian team members), which showed 0 without JavaScript; two named stories ("Hosana's Story"); blog; newsletter.
- **pih.org**: hero "We Demand Justice in Health Care" + three stark statistics; "What Drives Us"; "Your Impact" (four numbers introduced by "With your support"); stories; founder tribute.
- **amref.org** (African-led, Nairobi): hero "Lasting Health Change In Africa"; annual report download; "Impact Stories" with named health workers ("Turning an Ordinary Midwife into a Super Midwife"); country list; ethics hotline. No visible numbers or donate widget: reads as institutional, less persuasive.
- Failed to load: savethechildren.org (403), ethiopiaid.org.uk (empty page). Framer's non-profit gallery listed 64 templates with no detail (it names "mission pages, impact stories, events, and donation links" as the standard set); Webflow gallery returned a parse error.

## Shared patterns

**Hero**: one strong photo of a person or community looking capable, a headline that states the goal in under 12 words (verb first), one supporting sentence, and "Donate" + "Our work" (or "Volunteer"). Local NGOs: add a small trust line under the buttons (registration number, year founded).

**Home page order (recommended)**
1. Header: logo, 4 links, language switch, solid "Donate" button.
2. Hero.
3. Impact band: 3 or 4 numbers with plain labels and the year.
4. Mission / who we are: 2 short paragraphs + photo.
5. Programmes: 3 to 4 photo cards (education, water, health, livelihoods), one line each.
6. One person's story: portrait, name, place, a quote, what changed.
7. How donations are used: simple split (e.g. 85 / 10 / 5) or "500 Birr provides..." equivalents.
8. Get involved: Donate, Volunteer, Partner.
9. Partners and donors: logo row; registration and audit note.
10. News/updates (optional), contact, bank/Telebirr details, social links.

**Signature elements**: large-number impact band; programme cards with photo on top; pull-quote story with a named person; funds-use bar or "your gift provides" equivalents; partner logo row in grey; persistent high-contrast Donate button; annual report link.

**Typography**: big, confident headlines (bold grotesque sans, or a warm serif for faith/community foundations), sentence case, 34 to 44px on mobile; numbers very large (48px+) with small labels; body 16 to 18px. Short lines, generous white space. Ethiopic: bold weights of Noto Sans Ethiopic hold up at display size.

**Palettes**
- A "Green season": primary `#1E7A46`, dark accent `#0E3B26`, light background `#FAF7EF`, text `#1C2420`; optional sun accent `#F2B11B` for the Donate button (dark text on it).
- B "Terracotta and deep blue": primary `#C4502A`, dark accent `#16324A`, light background `#FFF8F0`, text `#22201E`; optional accent `#F0B840`.

**Photo style**: eye-level, natural light, people active and smiling or concentrating: a teacher at a board, hands with grain, women meeting, tree planting, a farmer portrait. Name people in captions. Landscape heroes with open sky or blurred field for text. No distended need, no children alone looking sad, no foreign visitor at the centre.

**What converts on mobile**: Donate reachable in one tap from anywhere (sticky button); amounts in Birr with what each buys; bank transfer and Telebirr details as copyable text plus phone/WhatsApp/Telegram for pledges; volunteer form of three fields; counters rendered as static text so they never show 0.

## Do
1. State the goal in the headline; keep one primary action.
2. Show 3 to 4 honest numbers with year and source.
3. Tell one named person's story with their own words.
4. Explain where money goes and show registration and partners.
5. Offer a non-money action (volunteer, partner) next to Donate.

## Don't
1. No pity imagery or anonymous suffering; dignity first.
2. No animated counters that depend on JavaScript, and no invented statistics: leave the band out if there are none.
3. No eight-way choice of giving options on the home page (charity: water's eight cards suit a global brand, not a small NGO): three at most.

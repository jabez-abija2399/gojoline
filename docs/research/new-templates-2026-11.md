# Which templates to add next (2026-11-18)

Gojoline has 14 starter templates: café/restaurant, hotel, clinic, school, shop, church, mosque,
events, NGO, real estate, tour operator, personal, company, salon. This note picks the next ones
from three kinds of evidence: what Ethiopian businesses exist and sell online, what the leading
builders offer, and what our template can already show. Design briefs for the first batch are in
`docs/research/templates/` (same format as the existing 14): `fashion.md`, `construction.md`,
`garage.md`, `bakery.md`, `studio.md`, `training.md`, `pharmacy.md`, `gym.md`.

## Evidence

**Our own data is too thin to steer this.** 13 projects so far, nearly all this week; 12 started
from a description, 1 from a template (café). Re-check once real owners arrive.

**Ethiopian businesses** (Ethiopian Yellow Pages, 19,560 firms, 15.4k in Addis; it leans to
formal firms, so read it as "who lists themselves", not the whole economy). Largest categories not
covered by a template we have, with counts:

| Category | Firms | Covered today? |
| --- | --- | --- |
| Clothing & accessories (+ jewellery 248, beauty products 183) | 1,088 | Only as a generic "shop" |
| Food retail (bakeries, cake shops, butcheries) | 975 | No |
| Building materials (+ construction 630) | 770 | No |
| Vehicle services (+ car rental 73) | 728 | No |
| Advertising, printing (289) | 678 | No |
| Farming / agri (export growing since the 2024 FX reform) | 574 | No |
| Home & garden, furniture (281) | 460 | No |
| Travel agents (tickets, visas; tours are covered) | 444 | Partly |
| Pharmacies | 311 | No (clinic only) |
| Training centres (+ private-school boom: 1,640 private schools in Addis) | 220 | Schools only |
| Photography (+ event equipment 141); weddings are a big spend (decor 80k–250k Birr) | 197 | Events, not vendors |
| Lawyers and legal services | 307 | Company only |

Other signals: Telegram carries about 95% of social commerce in Ethiopia and most sellers sell
only through social media, so a site must hand orders to Telegram, not replace it. Diaspora demand
is real for habesha dress (made to measure, shipped by DHL), gift delivery, cakes for family, and
wedding services. Many micro businesses close within a year, so a fast, cheap start matters more
than features.

**What the leading builders offer** (Wix, Squarespace, Framer, Webflow, Hostinger, Shopify, Carrd,
Zoho, GoDaddy Airo, Durable; Bumpa in Nigeria). Categories nearly all of them have and we don't:
construction and trades, fitness, fashion, professional services (law, accounting), interior
design, photography, weddings, tutoring/courses, automotive, bakery/catering, music, one-page
"link in bio" sites. Nobody publishes usage numbers; Webflow's and Framer's counts show what
designers make, Wix's "most popular" list (interior designer, artist, construction company,
wedding, fitness, photography) is the closest thing to demand data.

**What our template can already show.** Every candidate below fits the existing sections (cards
with price, badge, meta and filters; price lists by category; schedules; booking and order forms
with date, time, number and select fields; galleries; tabs; steps; FAQ; donations). So a new
template is content work (English and Amharic text, about 10 licensed photos, a style and font),
not new code. Two small additions would help several templates: a file field on forms (print
artwork, prescriptions, measurements photo) and a size/option list on catalogue cards.

## Recommendation: first batch of 8

Ranked where both lists agree (many Ethiopian firms and a standard category at every builder):

| # | Template | Who it is for | What visitors do there |
| --- | --- | --- | --- |
| 1 | **Fashion** (`fashion`) | Boutiques, habesha kemis makers, tailors, small clothing brands | Browse styles with prices, order on Telegram, send measurements, check shipping abroad |
| 2 | **Construction** (`construction`) | Building materials, hardware, aluminium/steel, finishing and small contractors | Check prices per unit, request a quote, see delivery areas and past projects |
| 3 | **Garage and car rental** (`garage`) | Garages, car service, car rental with driver | See service prices or the fleet with day rates, book a date, airport pickup |
| 4 | **Bakery** (`bakery`) | Bakeries, cake shops, pastry, catering | See cakes, order for a date with a message, holiday specials, order for family from abroad |
| 5 | **Wedding and event studio** (`studio`) | Photographers, videographers, decor, planners, equipment rental | Look at past weddings, compare packages, ask if a date is free |
| 6 | **Training centre** (`training`) | Tutoring, exam prep, languages, computer courses, driving schools | See courses with fee and next intake, timetable, register |
| 7 | **Pharmacy** (`pharmacy`) | Pharmacies, drug stores, medical supplies | Check hours and night duty, ask if something is in stock, directions |
| 8 | **Gym** (`gym`) | Gyms, fitness and yoga studios, martial arts | Compare memberships, see the class timetable, book a free trial |

Gyms have no directory count, but every builder carries fitness and Addis gyms are visible and
growing; it also reuses our schedule and price sections well.

**Second batch** (good evidence, narrower or overlapping): furniture and interior design; travel
agent (tickets and visas); law and accounting firm; printing and branding; coffee and agri
exporter (English first, sample requests); diaspora gift delivery; music artist/DJ; a one-page
"link in bio" site for Telegram and TikTok sellers.

## Ideas for how owners choose

1. **Pick the template from the first message.** Airo and Durable ask for the business type first;
   we already start from a description, so the agent can choose the nearest starter itself.
2. **Group the gallery** (Food, Shops, Health, Services, Faith and community, Stay and travel,
   Learning, Personal) once there are more than 20, with "Good for…" on each card, as Wix does.
3. **A one-page option** for sellers who live on Telegram, TikTok and Instagram.
4. **Optional licence number and TIN** in the footer of business templates; Ethiopian buyers look
   for them (pharmacies and contractors especially), although no rule requires them online.

## Rules the templates must respect

- **Pharmacy:** Proclamation 1112/2019, Art. 59(1) bars advertising any medicine unless an EFDA
  directive allows it, so the template names no medicine, brand or price at all (services, hours,
  advice, health products that are not medicines); the EFDA licence number, outlet type and the
  responsible pharmacist are shown; prescription photos are optional and treated as private health
  data. Design rules, not legal advice.
- **Schools and training:** fees shown only if the owner wants (Addis caps school fees).
- **All:** sample photos are samples to replace, never the owner's own premises or staff (existing
  rule); example prices and phone numbers can't be published as real (existing check).

## Sources

ethyp.com (browse-business-directory) · 2merkato.com · addisfortune.news (Addis Chamber; private
schools; e-commerce rules) · african.business (social commerce, 2023) · thereporterethiopia.com
(boutiques on Telegram; weddings; habesha kemis prices) · ethiopianbusinessreview.net (gift
delivery; weddings) · eea-et.org (MSE survey 2023) · africaportal.org (MSE sectors) ·
ethiotelecom.et (domain prices) · faolex.fao.org (Proclamation 1112/2019) · wix.com/website/templates ·
squarespace.com/templates · framer.com/marketplace · templates.webflow.com/categories ·
hostinger.com/website-templates · themes.shopify.com · carrd.com/build · godaddy.com (Airo) ·
durable.com/industries · getbumpa.com · framer.university (template niches)

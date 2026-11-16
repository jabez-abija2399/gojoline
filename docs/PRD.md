# Gojoline product requirements (Phase 1)

**Promise:** a non-technical person describes their business in Amharic or English and gets a working, published website with simple backend features in under 10 minutes.

## Users

Ethiopian small businesses (cafés, restaurants, shops, salons, clinics, hotels, tour operators, real estate), institutions (schools, churches and mosques, NGOs, event organisers), freelancers and creators. Later: Africa and worldwide.

## Core flow

1. Sign up with phone or email (verified).
2. Pick a template or describe the business in Amharic or English.
3. The AI asks 2 to 3 clarifying questions (name, services, contact, colours).
4. Live preview appears; the user edits by chat ("make the header green", "add a menu page").
5. Publish to `name.gojoline.site`, or a custom domain on a paid plan.
6. Visitors submit forms; the owner gets a Telegram message and sees entries in the dashboard.

## Phase 1 features

| Area | Included |
| --- | --- |
| AI builder | Chat in Amharic + English, live preview, chat edits, version history and restore |
| Websites | Mobile-first multi-page sites, Ge'ez + Latin fonts, language switch, SEO basics (prerendered pages, meta, sitemap) |
| Simple full-stack (Gojoline Cloud) | Contact, booking, order and registration forms saved to the database; owner login; editable lists (menu, products, rooms, events); image upload |
| Owner dashboard | Mobile-friendly submissions and list editing |
| Telegram | Form notifications to the owner; basic bot edits (text, prices, photos) |
| Payments in sites | Chapa payment button (sandbox until licensed) |
| Publishing | Free subdomain; custom domains on paid plans |
| Templates | Café/restaurant, hotel, clinic, school, shop, church/mosque, events, NGO, real estate, tour operator |
| Billing | Plans and AI changes (credits) sized by request; manual Birr payment (Telebirr/CBE receipt upload, admin approval, audit log); discount codes and a launch offer |
| Trust and safety | Content checks on prompts and pages, verification before publish, report-abuse link, rate limits |
| Admin | Approve payments, review reports, take sites down, view costs per user |

**Out of scope for Phase 1:** multi-role apps, marketplaces, full e-commerce (cart, inventory), visitor accounts, mobile apps, connect-your-own-Supabase, GitHub export.

## Plans (hypotheses to test)

Defaults live in `lib/billing/plans.ts` (`PRODUCTS`, `PLAN_FEATURES`) and `lib/billing/credits.ts`; prices, monthly changes, rollover, the extra-changes pack, changes per request size and the AI cost cap can be changed in Admin → Settings (credit changes apply from each owner's next monthly top-up; nobody loses changes they have).

| Plan | Price | Includes |
| --- | --- | --- |
| Free | 0 | 1 site on a free Gojoline address, badge, 10 AI changes/month (no rollover), 100 form answers/month, 50 MB photos, support in the Telegram channel |
| Starter | 499 ETB/month or 4,990/year | 1 site, own domain (bought separately) with a step-by-step guide, no badge, 50 changes/month (roll over up to 2 months), 2,000 answers/month, Telegram alerts, 500 MB photos, Telegram chat support |
| Business | 1,299 ETB/month or 12,990/year | Up to 3 sites, own domain per site and we connect it, no badge, 150 changes/month (roll over up to 2 months), 10,000 answers/month, Telegram alerts and edits by Telegram, 2 GB photos, priority support with setup help |
| Extra changes | 249 ETB | 30 more AI changes |

Every site's first build is free (one per site the plan allows, each month); changes that fail on our side are refunded (up to 12 changes a day).

**Changes per request.** Each request is sized before it runs (Claude Haiku, with a word list as fallback): small (text, price, photo, colour) 1 change, medium (a new section or page, a bigger restyle) 2, large (several pages, a new design) 4. Medium and large requests show the cost and ask first (“Go ahead” / “Make it smaller”; on Telegram, reply YES); nothing is charged more than the owner has. Each request has an AI cost cap of US$0.15 per change it uses (a free first build US$0.40); at the cap the agent stops, keeps finished work that builds, and otherwise undoes everything and gives the changes back. The Plan page shows changes left, the next monthly date, rollover, bought changes and the history of every change added or used.

**Discounts.** Admins make discount codes (percent 1–90 or whole Birr off, chosen products, optional most uses, last day and first-payment-only) and can switch them off (never deleted), and set a site-wide launch offer (percent off chosen products until a date, shown with the old price struck through). A code and the offer never stack: the better one applies. Prices after a discount are rounded down to whole Birr, never below 1 Birr. A code's use is counted when its payment is approved.

## Success metrics (private beta)

- 20 to 50 businesses with a published site
- Signup to published site ≥ 40%
- Sites with at least one form submission ≥ 50%
- Free to paid ≥ 5%; monthly paid churn ≤ 8%

## Quality targets (eval set)

| Metric | Target |
| --- | --- |
| Build success on first try | ≥ 90% |
| Build success after auto-fix | ≥ 98% |
| Amharic text correct and natural (reviewed) | ≥ 90% |
| Cost per first generation | ≤ $0.50 |
| Cost per edit | ≤ $0.03 |
| Time to first preview | ≤ 60 s |

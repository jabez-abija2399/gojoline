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
| Owner dashboard | Four sections with plain names, built for phones: **Home** (live card with Open, Share and a printable QR poster; one next step; people who visited, messages and messages waiting in the last 7 days against the week before; 14-day visitor bars; where visitors came from and phone vs computer; drafts lead with publishing), **Messages** (New → Replied → Done, one-tap Call/SMS/WhatsApp/Telegram, filters, delete, spreadsheet), **Business info** (phone, WhatsApp, Telegram, address, hours per weekday, closed today/for now, a banner; live on the site within a minute, no AI), **Settings** (Telegram alerts, address and own domain, take the site offline, Google and share preview, earlier versions). Visitors are counted privately (no cookies, no IPs kept). Content (menus, products, lists, photos) changes only through the AI builder, which uses changes (credits); Home's next steps point there (“Ask the AI to add your photos”). |
| Telegram | Form notifications to the owner; basic bot edits (text, prices, photos) |
| Payments in sites | Chapa payment button (sandbox until licensed) |
| Publishing | Free subdomain; custom domains on paid plans |
| Templates | Café/restaurant, hotel, clinic, school, shop, church/mosque, events, NGO, real estate, tour operator |
| Billing | Plans and AI changes (credits) sized by request; manual Birr payment (Telebirr/CBE receipt upload, admin approval, audit log); discount codes and a launch offer |
| Trust and safety | Content checks on prompts and pages, verification before publish, report-abuse link, rate limits |
| Feedback | Owners send an Idea, Problem, Praise or Question (message 5–2000 characters, optional 1–5 "How easy is Gojoline?", optional screenshot up to 4 MB for owners with a confirmed email or phone) from the sidebar's **Send feedback**, the builder's More menu, or "How was it?" after publishing; the page they came from, their language and device type go along. **My feedback** on the same page lists each item's status and the team's reply, with a badge in the menu when a reply is new. "Thank you, we read every message." |
| Admin | Approve payments, review reports, take sites down, view costs per user; a Feedback tab (count of new items, filters by status and type, owner with plan, page, rating and screenshot; change the status and reply, both audited); new feedback in Needs your attention |

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

**Changes per request.** Each request is sized before it runs (Claude Haiku, with a word list as fallback): small (text, price, photo, colour) 1 change, medium (a new section or page, a bigger restyle) 2, large (several pages, a new design) 4. Medium and large requests show the cost and ask first (“Go ahead” / “Make it smaller”; on Telegram, reply YES); nothing is charged more than the owner has. Each request has an AI cost cap of US$0.15 per change it uses; a free first build has its own cap (US$0.75 by default, admin-editable, never above US$2). Each turn may only write what is left of the cap pays for. Past 60% of the cap, or when another full rewrite would not fit, the agent is told “Budget low: finish now” and completes a smaller site that still has every section the owner asked for; at the cap the agent stops, keeps finished work that builds, and otherwise undoes everything (the changes are not given back: the owner is asked to split the request). The Plan page shows changes left, the next monthly date, rollover, bought changes and the history of every change added or used.

**Discounts.** Admins make discount codes (6–20 letters and digits; percent 1–90 or whole Birr off, chosen products, optional most uses, last day, first-payment-only, and once per customer, on by default) and can switch them off (never deleted), and set a site-wide launch offer (percent 1–90 off any of the products, top-up included, shown with the old price struck through). The offer has an optional last day (end of that day, Addis time); without one it runs until an admin switches it off and the public pages name no date (“Launch offer: 20% off”). A one-click switch at the top of Admin → Discounts turns it on or off at once and says its state (“Launch offer is on: 20% off Starter and Business”); each switch and each save is audited. An optional name in English and Amharic (both or neither) replaces “Launch offer” for customers, e.g. “Holiday offer”. Setting `offer` in `app_settings`: `{"active": true, "percent": 20, "products": ["starter_month", …], "until"?: "YYYY-MM-DD", "name"?: {"en": "…", "am": "…"}}`. A code and the offer never stack: the better one applies. Prices after a discount are rounded down to whole Birr, never below 1 Birr. A code's use is counted when its payment is approved, and only if the code is still on, was not ended before the payment was sent, and the customer may still use it. Unknown, switched-off and ended codes all read “not found” to customers.

**Running out.** When an owner has no changes left, the builder opens a short dialog (“You've used all your AI changes”): when the free or monthly changes come back (Addis time) and what would help, from the server's real values (admin prices, monthly changes, the launch offer struck through with its name). Free owners see Starter and Business side by side (coral “Upgrade to Starter”); paid owners see the extra-changes pack first (coral “Buy 30 more changes”) and, on Starter, Business. Every choice opens the Plan page's payment form with that product chosen (`?product=…#pay-title`). It opens when a request is refused at 0, when the owner sends at 0 (the message stays in the box; a new site's free first build still goes through), and once a month after a run uses the last change; never just for opening the page. Telegram edits at 0 keep their text answer.

**Plan and payments page.** A summary card (plan, changes left with a bar, when they renew, what the plan includes), plan cards with a monthly/yearly switch (saving, offer price struck through, “Your plan” marker, one action each), the extra-changes pack as its own card, then payment in three steps: 1) choose what to pay for (with “Have a code?” and a price, discount and to-pay breakdown), 2) send the money (Telebirr or CBE as cards, only those an admin filled in; account number, account holder name and the exact amount in large type, each with a copy button), 3) confirm (transaction number, receipt photo with a preview, “Send for checking”). After sending, or while a payment is being checked, it shows “We're checking your payment” with Sent → Checking → Approved, the usual time and a Telegram link. Payments (with status and any rejection reason) and the change history follow, folded on phones.

**Install the app.** Signed-in owners are offered the app in a small pop-up (a bottom sheet on phones, a corner card on large screens, never blocking the page): only where installing works (the browser offered it, or iPhone Safari with its two steps), never inside the installed app, never while the AI is working, and only after the first site is made or published or from the second visit. “Not now” waits 14 days; installing or answering the browser's prompt ends it for good. The account menu keeps its “Install the app” item.

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

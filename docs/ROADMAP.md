# Gojoline build roadmap

Work top to bottom. Each task is a vertical slice: build it, test it, tick it, commit, push. Record choices in `docs/DECISIONS.md`.

## Slice 0: Foundation
- [x] Next.js App Router + TypeScript strict + Tailwind + shadcn/ui, brand tokens and fonts (Outfit, Inter, Noto Sans Ethiopic)
- [x] Scripts: dev, build, typecheck, lint, test (Vitest), e2e (Playwright)
- [x] i18n (en, am) with language switch; Amharic layout check
- [x] Favicon, app icons, manifest and social image from `brand/`
- [x] Landing page in brand (EN + AM) with waitlist form
- [x] GitHub Actions CI: typecheck, lint, test, npm audit, Lighthouse CI budgets
- [x] Security headers and CSP middleware; Dependabot config
- [x] Playwright + axe accessibility checks wired into e2e

## Slice 1: Core loop (prompt → site → preview → edit)
- [x] `templates/site/` Vite + React template with sections library (hero, about, menu/services, gallery, contact, map, footer)
- [x] `LLMProvider` (Anthropic SDK, streaming, prompt caching, cost logging)
- [x] Agent loop with file tools and capped auto-fix
- [x] `SandboxProvider` (Vercel Sandbox) with pre-installed snapshot and preview URL
- [x] Builder UI: chat, live preview iframe, code view, mobile layout
- [x] Version history and restore
- [x] Eval set (30 prompts EN + AM) and runner reporting success, cost, time

## Slice 2: Accounts and data
- [x] Neon + Drizzle schema and migrations
- [x] Better Auth (email + phone), projects list
- [x] Persist projects, messages, versions, AI usage

## Slice 3: Publish
- [x] `PublishProvider`: build and publish static site to `name.gojoline.site` (Vercel fallback on `gojo-<name>.vercel.app` until Cloudflare credentials and the domain exist)
- [x] SEO basics in template (prerender, meta, sitemap)
- [x] Custom domains (paid; switched on per plan once billing lands in Slice 6)

## Slice 4: Gojoline Cloud (simple full-stack)
- [x] Public Data API for forms, lists, uploads with per-site keys and rate limits
- [x] Template components: contact/booking/order forms, editable lists
- [x] Owner dashboard (submissions, list editing), owner login

## Slice 5: Telegram
- [x] Bot: link owner chat, form notifications
- [x] Bot edits: text, prices, photos through the agent

## Slice 6: Billing
- [x] Plans, credits ledger, metering per AI edit
- [x] Manual payments: receipt upload, admin approval, audit log

## Slice 7: Trust and safety + admin
- [x] Content checks on prompts and pages before publish
- [x] Verification before publish, report-abuse link, takedown
- [x] Admin panel: payments, reports, sites, costs

## Slice 8: Beta readiness
- [x] All templates (10 industries) in EN + AM
- [x] Sentry, uptime checks, error pages
- [x] Privacy policy and terms pages (to be reviewed by a lawyer)
- [ ] Eval targets met (see PRD): all met except the Amharic quality score (needs a native-speaker review)

## Launch polish (2026-11-15)
- [x] Email sign-in codes (Resend, `afridea.et`) and Google sign-in, live in production
- [x] Manual payments with admin-editable payment details and prices
- [x] Landing page redesign: live hero demo with the build steps, templates, pricing in Birr, FAQ
- [x] Installable app (PWA) with offline page
- [x] Builder asks which languages the site should have (English, Amharic or both) before the first build
- [x] Live build timeline in the chat (understanding, writing, checking, fixing, ready)
- [x] Admin dashboard: overview KPIs, needs-attention list, 30-day charts, owners search, dark mode
- [x] Site template: motion and depth (CSS only, reduced-motion safe), bento services, editorial gallery, timeline section
- [x] Personal website / portfolio template (12 templates in total)
- [x] Builder redesign: one top bar, describe-your-business start box with ideas, next-step suggestions, phone-framed preview with a live address bar, Photos tab and add-photo button in the chat, version timeline
- [x] Landing page rebuilt: real start box in the hero (carries the description through sign-in into a build), pictures of the 12 real template sites, measured numbers, woven-border motif, waitlist moved to its own page
- [x] Site template upgrade: 16 drawings in the site's colours instead of empty boxes, real heading fonts, questions and call-to-action sections, a call bar on phones, fuller footer; all 12 presets updated
- [x] New brand palette "Paper and Coral" (light and dark tokens) across the app; landing page restyled with a centred prompt-first hero
- [x] Landing page rebuilt after Zite and the builders it compares: floating menu, serif headline, a showcase of the real builder switched by business chips, prompt section, steps on ink with colour panels
- [x] Templates and Prices on their own pages with menu links; landing showcase in brand colours only
- [x] Signed-in area redesign after Lovable and other AI builders: sidebar / phone drawer with changes-left meter, greeting + one prompt box, site cards with live state, real template pictures, free Undo under each AI change, changes left in the builder (research in `docs/research/builder-ux-2026-11.md`)
- [x] Dark mode for the signed-in area; one compact type scale on every screen
- [x] Site dashboard Overview: live status and sharing, real numbers, 14-day answers chart, latest answers, setup checklist
- [x] Landing page motion and interactive sections (self-playing demo, marquee, before/after slider, counting numbers); public pages adapt to signed-in visitors

## Niche templates (2026-11-16)
- [x] Research per niche: the best sites of each kind, written up as briefs (`docs/research/templates/`)
- [x] Sample-photo library (141 photos, free commercial licences) with a catalogue; only the photos a site uses reach its sandbox and its published files
- [x] Site template: four styles, two more heading fonts, full-screen and portrait heroes, picture cards, stats, steps, schedule and quote sections
- [x] All templates rebuilt on the research with real photos, in English and Amharic, plus two new ones (company, salon): 14 in total
- [x] Template preview pages: every page and section of a template, computer and phone, before it is picked
- [x] Template pages v2: categories with link chips, breadcrumb, "Designed for", "What's included" backed by the template's sections, browser and phone frames, details column on large screens, "Used by N businesses" (verified owners with a live site, shown from 10); design, performance and security reviews run and fixed (2026-11-16)
- [x] Motion and interaction kit in the site template, from motion research on the best sites of each niche; all 14 templates use it
- [x] Template previews run the real site (live demos inside Gojoline), on computer and phone

## Credits and discounts (2026-11-16)
- [x] Request sizes (small 1, medium 2, large 4 changes) sized by Claude Haiku with a word-list fallback; bigger requests ask first in the builder and on Telegram; multi-change debit and refund, atomic
- [x] AI cost cap per request (US$0.15 per change, first build US$0.40) and fewer agent turns for small requests; the site is never left half-written
- [x] Admin → Settings → Changes (credits): monthly changes, rollover, pack size, changes per size, cost cap (audited, from the next monthly top-up)
- [x] Plan page: next monthly date, rollover, bought changes, changes per size, history of every change; builder shows what each answer used, low and zero notes
- [x] Discount codes and launch offer (Admin → Discounts), price shown before sending, use counted on approval

## Site dashboard v2 (2026-11-16)
- [x] Site dashboard v2: Home (QR poster, share, next step, private visitor numbers), Messages (New/Replied/Done, call and WhatsApp links), Business info (live on the site without AI), Content (lists and photos together), Settings (Telegram, address, offline switch, Google and share preview, earlier versions); privacy-friendly visit counting with a daily rollup
- [x] Content section removed from the site dashboard (2026-11-16): menus, products, lists and photos change through the AI, which uses changes; old Content links open Home
- [x] Launch offer made flexible (optional last day, one-click switch, own name in both languages) and admin made denser (2026-11-16)

## Upgrade, install and payments (2026-11-16)
- [x] Upgrade dialog when an owner runs out of changes (refused, sending at 0, once a month after the last change); plans and the top-up with real prices and the offer; goes to the payment form with the product chosen
- [x] Install pop-up for signed-in owners (bottom sheet / corner card, after the first site or from the second visit, “Not now” for 14 days), one shared install hook with the menu item
- [x] Plan and payments redesign: summary, plan cards with monthly/yearly, payment in three steps with copy buttons, checking status with a timeline, history with status chips (folded on phones); admin labels name the account holder and number

## Feedback (2026-11-17)
- [x] Owner feedback: Send feedback (sidebar, builder menu, after publish) with type, message, optional rating and screenshot, page/language/device captured; My feedback with status, reply and an unread badge; admin Feedback tab with filters, status and reply (audited), new feedback in Needs your attention; 10 per owner and 30 per network an hour

## Builder polish (2026-11-17)
- [x] Free first builds finish: the first-build cost cap is an admin setting (default US$0.75 from measured runs, hard limit US$2), the next turn's input is estimated as cache reads (a cold first turn no longer ends a finished build as “stopped part-way”), and near the cap the agent is told “Budget low: finish now” and completes every requested section
- [x] AI replies render a safe markdown subset (bold, italic, code, lists, line breaks) in the builder chat and the progress card; Telegram replies are escaped HTML with bullets
- [x] Progress card follows real agent steps: understanding, planning, writing (with the sections being written), checking, fixing, finishing up, saving, ready (en, am)
- [x] Review fixes (design, performance, security): wrap-up threshold scaled to the budget, strict budget for free builds, budget note inside tool results, no file paths sent to the browser, one quiet status line on the progress card, deferred markdown parse, no Ethiopic italics, admin form keeps typed values, cap-specific errors

## Growth loops (2026-11-18)
- [x] Badge fix: “Made with Gojoline” is a small pill linking to the app's own address (`/{lang}?ref=site_<slug>` plus utm tags), never gojoline.com; only the plan decides, and publish adds it outside the site's app (shadow root, inline `!important`) so the site's CSS can't hide it
- [x] Sign-up sources: first touch (`?ref=`, `utm_source/medium/campaign`, or the referring host) kept in the first-party `gojo_src` cookie by the proxy (never replaced, 90 days, httpOnly), saved once per new account in `signup_sources` (migration 0018); Admin → Overview shows “Where sign-ups came from” (badge, referral, Telegram, TikTok, Facebook, LinkedIn, QR, other, direct) for 7 and 30 days
- [x] Referral credits: each owner's invite link `/{lang}?ref=u_<code>` on the Plan page (copy, share on Telegram, how many joined) and “Invite a business” in the sidebar; when an admin approves the invited owner's first real payment, both get one month of Starter's AI changes (ledger reason `referral`); self-invites blocked (same account, mailbox, company domain or phone), one reward per invited owner, at most 5 inviter rewards a month, audited; Admin → Growth lists invites (migration 0019)
- [x] Share previews for customer sites: every page has og:title, og:description, og:type, og:site_name, og:locale (+ alternates), og:url, og:image (the owner's share picture, else the page's or home page's hero photo) with og:image:alt, and twitter tags, so a link pasted in Telegram shows a card; template demos rebuilt (badge and report links on our own host)
- [x] Review fixes: referral rewards only for plan payments, the first-touch cookie cleared at sign-up, same-device invites blocked and same-network ones flagged in the admin's payment review (“Invited by …”), the monthly cap counted under a row lock and the reward in one transaction; an invite link replaces an earlier non-invite source; showcase cards from the published version only (name and a 640 px WebP), cached list and long-cached thumbnails; template JS trimmed (badge out of the template, preview-only chunk left out of published builds); copy and accessibility fixes
- [x] Public showcase: owners opt in from dashboard Settings (“Show my site in the Gojoline showcase”, off by default); `/{lang}/showcase` lists opted-in live sites (not resting, taken down or hidden) with the hero photo (served by our own route), name, sector and link; admins hide or show entries from Admin → Growth (audited); in the footer and sitemap (migration 0020)
- [x] Sector pages for search: `/{lang}/website-for/<sector>` for café, restaurant, church, mosque, school, salon, shop, hotel, clinic, wedding, NGO and portfolio, each with its own headline, intro, 3 benefits, 3 questions, the matching template's preview and a start button with that template chosen, WebPage + FAQPage JSON-LD, links to the other sectors, in the sitemap

## First-build preview (2026-11-18)
- [x] No starter template during a first build: a building placeholder in the device frame (site outline, current step, elapsed time, “Usually about a minute”; still under reduced motion; en, am, dark, 360 px), the site fades in once its frame has loaded, a failed first build shows the recovery message; later edits and template starts unchanged; progress label lists the newest three sections cleanly (“and 2 more”)

## Later (postponed by the founder)
- [ ] Chapa: `PaymentProvider` implementation (sandbox) + Chapa button in templates

## Follow-ups
- First-build preview (2026-11-18): e2e runs on the in-memory sandbox, whose preview is `about:blank`, so the reveal is checked on that frame; check the fade on a real Vercel Sandbox preview after deploy. The Amharic placeholder strings need the native-speaker review.
- Growth (2026-11-18): claw back an invite thank-you when refunds or payment reversals are built (the reward is a `referral` ledger row per owner, ref `referral:<invited id>`, easy to reverse).
- Growth (2026-11-18): the Amharic sector page copy (`lib/landing/sectors.ts`) and the growth strings need a native-speaker review before launch.
- Growth (2026-11-18): the slice's design, performance and security reviews were done by the coordinator's reviewers (findings fixed); this session could not start the `.claude/agents` reviewers itself.
- Growth (2026-11-18): sites published before the showcase need one more publish to get a showcase card (name and photo come only from a publish).
- Builder polish (2026-11-17): paid edits keep the US$0.15-per-change cap and decide on another turn at the expected (cache-read) price, so a cache miss there can overshoot by about one turn (paid by the owner's change); a cold-cache edit pays about US$0.12 to write the system prompt to the cache alone, so measure cold edits next (`EVAL_ONLY=en-cafe npm run evals` after 5 idle minutes).
- The sidebar's Upgrade link at 0 still goes to the Plan page (the dialog needs prices and the offer on every signed-in page; not worth the extra reads for now).
- Manifest screenshots (Chrome's richer install sheet) not added: they need real app pictures without personal data.
- Credits and discounts (2026-11-16): the Amharic for request sizes, the bigger-change question, the history and the discount screens needs the native-speaker review. A stricter daily limit for requests stopped at their cost cap was considered and not built (they are no longer refunded). Measure Haiku sizing against real requests (cost is logged as "size"); the 2 s timeout falls back to the word list. The landing page's feature card still shows the plain Starter price (not the launch offer). The design, performance and security review agents could not be run from this session (no sub-agent tool); a self-review was done instead.
- Performance: phone LCP on `/templates` and template pages is ~3.5 s (budget 2.5 s), same as before template pages v2. Causes are site-wide: ~170 KB shared JS, the Ethiopic font preloaded on English pages, three Latin fonts, lazy pictures inside Chrome's load distance. Needs its own slice (2026-11-16).
- Set `PUBLISH_BASE_DOMAIN` in production once the customer-site domain exists; until then the template browser frame shows an empty address bar (never a guessed address).
- e2e: `billing.spec.ts` "a pricing Choose button keeps the yearly choice through sign-in" failed once on the phone project in a full run (2026-11-16) and passed 6 of 6 alone; probably the same first-render timing as the menu helper fixed that day.
- e2e: `safety.spec.ts` "someone reports a live site and an admin takes it down" failed once on desktop in a full run (2026-11-16, the report's thank-you status never appeared) and passed 12 of 12 alone; watch for it under load.
- e2e: `builder.spec.ts` "dark mode: chosen in the account menu…" on the phone project times out opening the account menu about one run in five, on `main` too (2026-11-16); passes on retry. Not yet traced.
- e2e: `safety.spec.ts` (report a site, admin takes it down) fails about one full-suite run in five on the phone project and never on its own (12 of 12 passes alone). It looks like timing under load in the report form's focus step; not yet traced.
- e2e: `credits.spec.ts` "discount code: an admin makes one…" failed once on desktop in a full run (2026-11-16) and then passed 32 of 32 (alone, repeated, and in a second full run); probably another admin test saving settings at the same moment. Watch for it.
- e2e: `upgrade.spec.ts` "a Starter owner at 0 is offered 30 more changes first" timed out once on the phone project in a full run (2026-11-17) and passed 24 of 24 alone; watch for it under load.
- e2e: `billing.spec.ts` "an owner sends a payment and an admin approves it" failed once on the phone project in a full run (2026-11-17) at the axe check (a serious violation on /en/billing; the details were overwritten before they could be read) and passed in the two other full runs. Trace it: run the phone project with the axe output kept. Note: repeating this test many times in parallel trips the sign-in code limit (expected).
- Site dashboard v2 follow-ups (2026-11-16): a weekly Telegram summary (visitors, messages, waiting); holiday hours (dates closed ahead of time); per-message notes; the visits route reads the site row once per view (cache `publicSite` for a minute per instance if traffic grows); the Amharic of the new dashboard strings (`lib/i18n/messages/dashboard-am.ts`) and the day names sent to sites need the native-speaker review. Sites published before 2026-11-16 count visitors and show business info only after one more publish (the dashboard says so). On Cloudflare, the sites Worker could inject the info same-origin into the page (no extra request, no runtime re-render at all); the public site cache is per server instance (a shared Redis copy would make invalidation instant everywhere); Vercel-hosted sites still swap to the resting page after the runtime check.
- The Answers tab still reads 200 full answers and each form one after another; a `formHeadings` query would make it and the overview lighter (performance review).
- Every signed-in page shows its main content after about 3 s on a slow phone (budget 2.5 s): the largest shared script takes about 400 ms to start; not caused by one page (performance review).
- Photo thumbnails in the builder and dashboard load the full stored photo; a small thumbnail size from the assets API would save data (performance review).
- Landing page, from the reviews: the sign-in page could say that the typed description is kept; AVIF and an Ethiopic font preload on `/am` are not done (budgets are met without them).
- Re-run `node scripts/showcase-shots.mjs` and `node scripts/template-sections.mjs` after changing the site template or a preset, so the landing page's pictures and the template previews stay true.
- Template pages v2 Amharic (2026-11-16) needs a native-speaker review: category names, "Designed for" lists and highlight wording in `lib/landing/template-info.ts`, and the new strings under `landing.gallery.categories` and `landing.templatePreview` in `lib/i18n/messages/am.ts`.
- Re-run `node scripts/template-demos.mjs`, `node scripts/template-sections.mjs` (cards) and `node scripts/showcase-shots.mjs` after changing the site template or a preset, so the live demos, cards and landing pictures stay true.
- The new builder and landing strings in Amharic (start box, ideas, suggestions, photos, gallery, numbers) need the same native-speaker review.
- Amharic in the 14 templates (`templates/site/presets/`, sources in `scripts/presets/`) was rewritten on 2026-11-16 and needs a native-speaker review; the church and mosque wording should be read by members of those communities.
- Sample photos: a few niches have little that is truly Ethiopian (hotel rooms, mosque interiors, real-estate interiors, a habesha wedding). Commissioned or licensed Ethiopian photos would lift them. Add photos with `node scripts/stock-photos.mjs <folder>`.
- Generated-site speed after the photo templates (performance review, 2026-11-16): before the smaller photo sizes, Lighthouse LCP on slow 4G was 2.2 to 3.4 s on photo-heavy home pages against the 2.0 s target. The 480 px sizes cut first-load photo bytes by more than half, but Lighthouse was not run again: re-measure hotel, tours, cafe and shop. If still over, load card and gallery photos only when scrolled near, and stop bundling the whole `site.json` into the script (JS is at 93 to 98 KB of the 100 KB budget).
- The photo library (12 MB) is traced into every route's function through the `"/**"` key in `next.config.ts`; scope it to the routes that build and publish.
- The builder landing page measured LCP 3.4 to 3.75 s in one run on a loaded machine during the review (budget 2.5 s); not compared with `main`. Check the Lighthouse CI result after this merge.
- Generated sites' script is 95.9 KB gzip of the 100 KB budget; Lighthouse's simulated LCP still adds the script's download (2.0 to 2.6 s on photo-heavy home pages, against 1.7 to 2.0 s measured on a throttled phone). Next step: hydrate only the interactive parts (display-only sections such as drawings, icons and cards are about 28 KB gzip), or a decision to move the template to Preact (react-dom is about 63 KB gzip).
- Amharic in the motion-kit additions (tabs, giving boxes, ribbons, announcements, prayer and service times, stamps) needs the native-speaker review with the rest of the templates.
- Template ideas from the writers, not built: a "from" note on service prices, an action on services and menu sections, a focal point for cropped photos, an included/not-included list for tours.
- Amharic quality of generated sites needs a native-speaker review (eval outputs in `evals/.runs/`); target ≥ 90%.

- Feedback (2026-11-17): no Telegram message to the founder for new feedback: there is no way yet to message admins on Telegram (payments reach admins by email only; Telegram links are per owner). Add an admin Telegram link (or reuse the payment email to `ADMIN_EMAILS`) and call it from `POST /api/feedback`. **The Amharic in `lib/i18n/messages/feedback-am.ts` needs the native-speaker review** (all owner and admin feedback strings, drafted by the build agent). Screenshots and thumbnails live in Postgres (verified owners only, 20 MB per owner, cleared after 90 days by the daily cron); move them and payment receipts to R2 behind `StorageProvider` when volume grows. Review fixes (security, performance, design) are done. The design, performance and security review agents could not be run from this session (no sub-agent tool); a self-review was done instead.

## Notes for deployment
- **Live:** https://gojoline.afridea.et (until the founder's own domain; `gojoline.vercel.app` also works). Vercel project `gojoline`, functions in `fra1`, linked to GitHub on 2026-11-15 (pushes to `main` deploy to production). `gojoline.vercel.app` redirects (308) to `gojoline.afridea.et`; the Telegram webhook points at the new domain. Uptime: Sentry monitor on `/api/health` every 5 minutes.
- Production env set on Vercel (2026-11-15): `DATABASE_URL` (Neon, pooled), `UPSTASH_REDIS_REST_URL`/`_TOKEN` (new free Upstash database `gojoline`, Frankfurt), `SAYSITE_ANTHROPIC_API_KEY`, `VERCEL_TOKEN`/`_TEAM_ID`/`_PROJECT_ID`, `SANDBOX_SNAPSHOT_ID`, `CSP_FRAME_ORIGINS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (generated), `BETTER_AUTH_SECRET` (generated), `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `SENTRY_DSN`, `AGENT_MODEL`. Telegram webhook registered to `/api/telegram/webhook`.
- Email sign-in (Resend) and Google sign-in are set. Still unset (features stay off until added): SMS gateway, `PAYMENT_*`, `ADMIN_EMAILS`/`ADMIN_PHONES`, R2/Cloudflare, Chapa.
- Sentry: project `gojoline` in the founder's Sentry organization. Set `SENTRY_DSN=https://28282cb223995ae0d77745325c298faf@o4512429782990848.ingest.us.sentry.io/4512432933371904` (a DSN is a public client key). Server errors only; no browser SDK.
- Production rate limits need `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; without them the waitlist refuses submissions on Vercel (fails closed by design).
- Database: Neon project `gojoline` (purple-brook-23584048, Frankfurt), database `gojoline`, migration `0000_init` applied. Set `DATABASE_URL` in the Vercel project (pooled connection string from the Neon console). Without it, dev and e2e use memory stores.
- Production needs `BETTER_AUTH_SECRET` (32+ chars) and `BETTER_AUTH_URL`.
- Builder needs `SAYSITE_ANTHROPIC_API_KEY`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, `SANDBOX_SNAPSHOT_ID` and `CSP_FRAME_ORIGINS=https://*.vercel.run`.

- Telegram: set `TELEGRAM_WEBHOOK_SECRET` (16+ random characters) in the app's env, then once per deployment URL run `APP_URL=https://<app> node --experimental-strip-types scripts/telegram-webhook.mts`. Until then the bot doesn't receive messages (linking, bot edits); answers still reach the dashboard.

## Blocked (needs the founder)
- **Feedback in production:** apply migration 0017 (`feedback` table with its indexes, additive) before the merge deploys. Screenshot retention runs in the existing `/api/cron/visits` cron, which needs `CRON_SECRET` (already listed above).
- **Site dashboard v2 in production:** set `CRON_SECRET` in Vercel (the daily visit rollup refuses without it; the dashboard's on-read top-up still keeps the last 3 days). Apply migration 0016 before the merge deploys. Redeploy the sites Worker (`scripts/cloudflare-setup.mjs`) so a resting site's pages show the resting page at the host too (until then the live site shows it itself, after loading).
- **Agent evals after the template guide changes (2026-11-15 and 2026-11-16):** `TEMPLATE.md` now teaches the agent `image.art`, `faq`, `cta`, and since 2026-11-16 sample photos, site styles, picture cards, stats, steps, schedules and the section order per kind of business. The guide is about three times longer, so cost per site will have changed. The eval run costs real money and was not run in this session (not permitted). Run `EVAL_ONLY=en-cafe,am-clinic npm run evals` (about $0.30) or the full set, and record the result in `evals/RESULTS.md`.
- **SMS sign-in:** needs a gateway for Ethiopian numbers (e.g. AfroMessage); until then phone users are asked to use email or Google.
- Vercel Sandbox snapshot storage: the 47 automatic snapshots left on 2026-11-14 (15.85 GB, never reused; they had put Functions Storage at 16.5 GB of the Hobby 10 GB) were deleted on 2026-11-16 at the founder's request. Kept: the base snapshot `snap_MBgmV…` (every sandbox starts from it: never delete it) and the older manual `snap_AwzZk…`. The code creates no snapshots per sandbox (`persistent: false`).
- Eval targets: build success (100%), cost per first site (median $0.089) and cost per edit (median $0.0295, 2026-11-15) are met. Still open: the Amharic quality score, which needs a native-speaker review of `evals/.runs/`.
- Legal review: `/[lang]/privacy` and `/[lang]/terms` are drafts written from what the product does (`lib/i18n/messages/legal.ts`, EN + AM, marked as drafts on the page). A lawyer should review them, and the founder should add the legal entity name and a contact address.
- Takedown policy and terms: the report page and takedown flow work, but the rules sites must follow (acceptable use) need the founder's and a lawyer's wording before launch (Slice 8 terms page).
- Payment details and prices: sign in as an admin (`ADMIN_EMAILS` is set to the founder's Vercel account email) and fill in Admin → Settings (Telebirr number, CBE account, account name, prices). Until then the Plan page says payments are coming soon.
- Vercel plan: Hobby allows 10 sandboxes at a time (each owner editing uses one for up to 15 minutes). For more than ~10 owners editing at once, the team needs Vercel Pro. Plan changes are the founder's decision.
- **Cloudflare publishing (built 2026-11-16, waiting for the founder):** the code publishes to `https://<name>.afridea.et` as soon as these exist. Founder, in the Cloudflare dashboard: (1) R2 Object Storage → enable (it may ask for a card; the free tier is 10 GB). (2) R2 → Manage API tokens → an **Object Read & Write** token for the `gojoline` bucket only (gives `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`). (3) My Profile → API Tokens → a **setup token** (Account · Workers Scripts · Edit, Account · Workers R2 Storage · Edit, Zone · Workers Routes · Edit, Zone · DNS · Edit, zone afridea.et) kept on your own machine as `CLOUDFLARE_API_TOKEN`, never in Vercel. (4) A second **app token** with only Zone · SSL and Certificates · Edit on afridea.et, as `CLOUDFLARE_SAAS_TOKEN`. In Vercel set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=gojoline`, `CLOUDFLARE_SAAS_TOKEN`, `CLOUDFLARE_ZONE_ID` and `PUBLISH_BASE_DOMAIN=afridea.et`. Then on your machine: `node scripts/cloudflare-setup.mjs` (dry run, with `VERCEL_TOKEN`/`VERCEL_TEAM_ID` so every Vercel name under afridea.et is kept), check the plan, then `--apply`. For customers' own domains also enable SSL/TLS → Custom Hostnames. Re-run the script after adding DNS records to afridea.et. Until all this, sites publish to `https://gojo-<name>.vercel.app`.
- **Live sites on Vercel (gojo-abeni and others):** they move to Cloudflare on their owner's next publish (the old address then forwards). A domain connected on Vercel must be connected again after the move. `gojo-itest-starter` is a test leftover the founder can delete.
- **Separate domain for customer sites (e.g. `gojoline.site`) before the public beta** (security review 2026-11-16): sites on afridea.et share the parent domain with the app and the founder's email, so one phishing site can get all of afridea.et flagged, and sites count as "same site" for the app (the app's Origin checks are then the only CSRF layer; keep every mutating route behind `guardBuilder`/`ownerRoute`/`sameOrigin`). Ideally also add it to the Public Suffix List. Then change `PUBLISH_BASE_DOMAIN`, run the setup script for the new zone, and set `DATA_API_ORIGIN` to a host that isn't the app's.
- A domain claim made while a site was on Vercel (`gojo-*` project ID) can't be released as stale through Cloudflare; the owner removes it from the dashboard instead.

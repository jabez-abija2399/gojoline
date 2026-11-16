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

## Later (postponed by the founder)
- [ ] Chapa: `PaymentProvider` implementation (sandbox) + Chapa button in templates

## Follow-ups
- Performance: phone LCP on `/templates` and template pages is ~3.5 s (budget 2.5 s), same as before template pages v2. Causes are site-wide: ~170 KB shared JS, the Ethiopic font preloaded on English pages, three Latin fonts, lazy pictures inside Chrome's load distance. Needs its own slice (2026-11-16).
- Set `PUBLISH_BASE_DOMAIN` in production once the customer-site domain exists; until then the template browser frame shows an empty address bar (never a guessed address).
- e2e: `billing.spec.ts` "a pricing Choose button keeps the yearly choice through sign-in" failed once on the phone project in a full run (2026-11-16) and passed 6 of 6 alone; probably the same first-render timing as the menu helper fixed that day.
- e2e: `builder.spec.ts` "dark mode: chosen in the account menu…" on the phone project times out opening the account menu about one run in five, on `main` too (2026-11-16); passes on retry. Not yet traced.
- e2e: `safety.spec.ts` (report a site, admin takes it down) fails about one full-suite run in five on the phone project and never on its own (12 of 12 passes alone). It looks like timing under load in the report form's focus step; not yet traced.
- Site dashboard: a visitors count needs privacy-friendly visit counting on published sites (not built; no number is shown until it exists). A QR code of the site's address to print for the shop would suit owners well.
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
- **Agent evals after the template guide changes (2026-11-15 and 2026-11-16):** `TEMPLATE.md` now teaches the agent `image.art`, `faq`, `cta`, and since 2026-11-16 sample photos, site styles, picture cards, stats, steps, schedules and the section order per kind of business. The guide is about three times longer, so cost per site will have changed. The eval run costs real money and was not run in this session (not permitted). Run `EVAL_ONLY=en-cafe,am-clinic npm run evals` (about $0.30) or the full set, and record the result in `evals/RESULTS.md`.
- **SMS sign-in:** needs a gateway for Ethiopian numbers (e.g. AfroMessage); until then phone users are asked to use email or Google.
- Vercel Sandbox snapshot storage: sandboxes start again (checked 2026-11-15); the code no longer leaves snapshots behind. The 47 old automatic snapshots can still be deleted in the Vercel project to free space (keep the 2 manual ones).
- Eval targets: build success (100%), cost per first site (median $0.089) and cost per edit (median $0.0295, 2026-11-15) are met. Still open: the Amharic quality score, which needs a native-speaker review of `evals/.runs/`.
- Legal review: `/[lang]/privacy` and `/[lang]/terms` are drafts written from what the product does (`lib/i18n/messages/legal.ts`, EN + AM, marked as drafts on the page). A lawyer should review them, and the founder should add the legal entity name and a contact address.
- Takedown policy and terms: the report page and takedown flow work, but the rules sites must follow (acceptable use) need the founder's and a lawyer's wording before launch (Slice 8 terms page).
- Payment details and prices: sign in as an admin (`ADMIN_EMAILS` is set to the founder's Vercel account email) and fill in Admin → Settings (Telebirr number, CBE account, account name, prices). Until then the Plan page says payments are coming soon.
- Vercel plan: Hobby allows 10 sandboxes at a time (each owner editing uses one for up to 15 minutes). For more than ~10 owners editing at once, the team needs Vercel Pro. Plan changes are the founder's decision.
- **Cloudflare publishing (built 2026-11-16, waiting for the founder):** the code publishes to `https://<name>.afridea.et` as soon as these exist. Founder: (1) Cloudflare dashboard → R2 Object Storage → enable (it may ask for a card; the free tier is 10 GB); (2) My Profile → API Tokens → custom token with Account·Workers Scripts·Edit, Account·Workers R2 Storage·Edit, Zone·Workers Routes·Edit and Zone·DNS·Edit (zone afridea.et), plus Zone·SSL and Certificates·Edit for customers' own domains; (3) R2 → Manage API tokens → an Object Read & Write token for the `gojoline` bucket. Then set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=gojoline`, `CLOUDFLARE_API_TOKEN` and `PUBLISH_BASE_DOMAIN=afridea.et` in Vercel (and in the Claude environment), run `node scripts/cloudflare-setup.mjs` (dry run), check its plan, then `--apply`. For customers' own domains also enable SSL/TLS → Custom Hostnames. Until then sites publish to `https://gojo-<name>.vercel.app`.
- **Live sites on Vercel (gojo-abeni and others):** they move to Cloudflare on their owner's next publish (the old address then forwards). A domain connected on Vercel must be connected again after the move. `gojo-itest-starter` is a test leftover the founder can delete.
- Separate domain for customer sites (e.g. `gojoline.site`) before a big launch, so one bad site can't get afridea.et flagged: change `PUBLISH_BASE_DOMAIN` and run the setup script for the new zone.

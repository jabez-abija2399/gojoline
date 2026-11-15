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

## Later (postponed by the founder)
- [ ] Chapa: `PaymentProvider` implementation (sandbox) + Chapa button in templates

## Follow-ups
- Photo thumbnails in the builder and dashboard load the full stored photo; a small thumbnail size from the assets API would save data (performance review).
- Landing page, from the reviews: real photos in the starter templates would make the gallery stronger (they show placeholder shapes now); the sign-in page could say that the typed description is kept; AVIF and an Ethiopic font preload on `/am` are not done (budgets are met without them).
- Re-run `node scripts/showcase-shots.mjs` after changing the site template or a preset, so the landing page's pictures stay true.
- The new builder and landing strings in Amharic (start box, ideas, suggestions, photos, gallery, numbers) need the same native-speaker review.
- Amharic in the 12 templates (`templates/site/presets/`) needs the same native-speaker review as generated sites.
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
- **SMS sign-in:** needs a gateway for Ethiopian numbers (e.g. AfroMessage); until then phone users are asked to use email or Google.
- Vercel Sandbox snapshot storage: sandboxes start again (checked 2026-11-15); the code no longer leaves snapshots behind. The 47 old automatic snapshots can still be deleted in the Vercel project to free space (keep the 2 manual ones).
- Eval targets: build success (100%), cost per first site (median $0.089) and cost per edit (median $0.0295, 2026-11-15) are met. Still open: the Amharic quality score, which needs a native-speaker review of `evals/.runs/`.
- Legal review: `/[lang]/privacy` and `/[lang]/terms` are drafts written from what the product does (`lib/i18n/messages/legal.ts`, EN + AM, marked as drafts on the page). A lawyer should review them, and the founder should add the legal entity name and a contact address.
- Takedown policy and terms: the report page and takedown flow work, but the rules sites must follow (acceptable use) need the founder's and a lawyer's wording before launch (Slice 8 terms page).
- Payment details and prices: sign in as an admin (`ADMIN_EMAILS` is set to the founder's Vercel account email) and fill in Admin → Settings (Telebirr number, CBE account, account name, prices). Until then the Plan page says payments are coming soon.
- Vercel plan: Hobby allows 10 sandboxes at a time (each owner editing uses one for up to 15 minutes). For more than ~10 owners editing at once, the team needs Vercel Pro. Plan changes are the founder's decision.
- Cloudflare R2/publishing credentials (`CLOUDFLARE_API_TOKEN`, `R2_*`): until added, store snapshots and publish through a fallback provider
- Publishing domain (`gojoline.site` or similar): until bought, sites publish to `https://gojo-<name>.vercel.app` (one Vercel project per site)

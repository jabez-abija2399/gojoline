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
- [ ] Public Data API for forms, lists, uploads with per-site keys and rate limits
- [ ] Template components: contact/booking/order forms, editable lists
- [ ] Owner dashboard (submissions, list editing), owner login

## Slice 5: Telegram
- [ ] Bot: link owner chat, form notifications
- [ ] Bot edits: text, prices, photos through the agent

## Slice 6: Billing
- [ ] Plans, credits ledger, metering per AI edit
- [ ] Manual payments: receipt upload, admin approval, audit log

## Slice 7: Trust and safety + admin
- [ ] Content checks on prompts and pages before publish
- [ ] Verification before publish, report-abuse link, takedown
- [ ] Admin panel: payments, reports, sites, costs

## Slice 8: Beta readiness
- [ ] All templates (10 industries) in EN + AM
- [ ] Sentry, uptime checks, error pages
- [ ] Privacy policy and terms pages (to be reviewed by a lawyer)
- [ ] Eval targets met (see PRD)

## Later (postponed by the founder)
- [ ] Chapa: `PaymentProvider` implementation (sandbox) + Chapa button in templates

## Follow-ups
- Amharic quality of generated sites needs a native-speaker review (eval outputs in `evals/.runs/`); target ≥ 90%.
- Edit cost median $0.031 vs $0.03 target: re-run evals after the search_replace prompt change.

- Custom domains: release a domain claim that stays unverified for more than 7 days (squatting), before plans with custom domains go on sale.

## Notes for deployment
- Production rate limits need `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; without them the waitlist refuses submissions on Vercel (fails closed by design).
- Database: Neon project `gojoline` (purple-brook-23584048, Frankfurt), database `gojoline`, migration `0000_init` applied. Set `DATABASE_URL` in the Vercel project (pooled connection string from the Neon console). Without it, dev and e2e use memory stores.
- Production needs `BETTER_AUTH_SECRET` (32+ chars) and `BETTER_AUTH_URL`.
- Builder needs `SAYSITE_ANTHROPIC_API_KEY`, `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, `SANDBOX_SNAPSHOT_ID` and `CSP_FRAME_ORIGINS=https://*.vercel.run`.

## Blocked (needs the founder)
- Sign-in code delivery: choose an SMS gateway for Ethiopian numbers (e.g. AfroMessage, Geez SMS) and/or an email service (e.g. Resend) and add its key. Until then production sign-in shows "not open yet" (`OtpSender` interface in `lib/providers/notify/otp.ts`; development prints codes in the server log).
- Cloudflare R2/publishing credentials (`CLOUDFLARE_API_TOKEN`, `R2_*`): until added, store snapshots and publish through a fallback provider
- Publishing domain (`gojoline.site` or similar): until bought, sites publish to `https://gojo-<name>.vercel.app` (one Vercel project per site)

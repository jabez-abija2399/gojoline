# Gojoline build roadmap

Work top to bottom. Each task is a vertical slice: build it, test it, tick it, commit, push. Record choices in `docs/DECISIONS.md`.

## Slice 0: Foundation
- [ ] Next.js App Router + TypeScript strict + Tailwind + shadcn/ui, brand tokens and fonts (Outfit, Inter, Noto Sans Ethiopic)
- [ ] Scripts: dev, build, typecheck, lint, test (Vitest), e2e (Playwright)
- [ ] i18n (en, am) with language switch; Amharic layout check
- [ ] Favicon, app icons, manifest and social image from `brand/`
- [ ] Landing page in brand (EN + AM) with waitlist form
- [ ] GitHub Actions CI: typecheck, lint, test

## Slice 1: Core loop (prompt → site → preview → edit)
- [ ] `templates/site/` Vite + React template with sections library (hero, about, menu/services, gallery, contact, map, footer)
- [ ] `LLMProvider` (Anthropic SDK, streaming, prompt caching, cost logging)
- [ ] Agent loop with file tools and capped auto-fix
- [ ] `SandboxProvider` (Vercel Sandbox) with pre-installed snapshot and preview URL
- [ ] Builder UI: chat, live preview iframe, code view, mobile layout
- [ ] Version history and restore
- [ ] Eval set (30 prompts EN + AM) and runner reporting success, cost, time

## Slice 2: Accounts and data
- [ ] Neon + Drizzle schema and migrations
- [ ] Better Auth (email + phone), projects list
- [ ] Persist projects, messages, versions, AI usage

## Slice 3: Publish
- [ ] `PublishProvider`: build and publish static site to `name.gojoline.site`
- [ ] SEO basics in template (prerender, meta, sitemap)
- [ ] Custom domains (paid)

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
- [ ] `PaymentProvider` with Chapa (sandbox) + Chapa button in templates

## Slice 7: Trust and safety + admin
- [ ] Content checks on prompts and pages before publish
- [ ] Verification before publish, report-abuse link, takedown
- [ ] Admin panel: payments, reports, sites, costs

## Slice 8: Beta readiness
- [ ] All templates (10 industries) in EN + AM
- [ ] Sentry, uptime checks, error pages
- [ ] Privacy policy and terms pages (to be reviewed by a lawyer)
- [ ] Eval targets met (see PRD)

## Blocked (needs the founder)
- (none yet)

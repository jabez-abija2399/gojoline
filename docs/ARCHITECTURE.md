# Gojoline architecture

One Next.js app on Vercel runs an AI agent that writes code into a fixed Vite + React template, previews it in a cloud sandbox, and publishes static sites that use a shared Gojoline Cloud backend.

```
Owner (web/phone) ──chat──▶ Builder app (Next.js) ──▶ AI agent ──▶ Claude API
Telegram bot ──quick edits──▶ AI agent ──files──▶ Vercel Sandbox (build + live preview)
AI agent ──publish──▶ Published sites (*.gojoline.site, static) ──data API──▶ Gojoline Cloud (Neon)
Gojoline Cloud ──notify──▶ Owner's Telegram
```

## Repository layout (target)

```
app/                 Next.js routes (builder UI, dashboard, admin, API routes)
components/          UI components (shadcn/ui based)
lib/agent/           Agent loop, tools, prompts, cost tracking
lib/providers/       sandbox/, payment/, llm/, publish/, storage/, notify/
lib/db/              Drizzle schema, queries, migrations
lib/i18n/            en + am message catalogs
lib/safety/          Prompt and page content checks, rate limits
templates/site/      The one generated-site template (Vite + React)
evals/               Prompt eval set and runner
brand/               Logos, icons, tokens
docs/                PRD, architecture, roadmap, decisions, setup
e2e/                 Playwright tests
```

## Components

- **Agent loop** (`lib/agent`): plan, then edit files with tools (`read_file`, `write_file`, `search_replace`, `list_files`, `run_build`, `read_errors`). Auto-fixes build errors up to 3 times. Only relevant files go into context; system prompt and template docs are cached. Streams progress to the UI from real agent events (the model starting to think, a tool call starting, the site sections named in a streaming `site.json` write, builds, the budget wrap-up, saving), which drive the builder's progress card; no timers. Logs tokens and cost per request.
- **Sandbox** (`SandboxProvider`, Vercel Sandbox first): a snapshot with the template's dependencies pre-installed so preview starts in seconds. The preview URL loads in an iframe.
- **Versioning**: each AI change creates a snapshot (files to R2, row in Postgres) that can be restored.
- **Gojoline Cloud**: one Postgres with rows scoped by `project_id` and checked on every query. Generated sites call a small public Data API (`/api/sites/:siteId/forms`, `/lists`, `/uploads`, owner login) with per-site keys and rate limits.
- **Publishing** (`PublishProvider`): production build becomes static files. On our own server (since 2026-11-27, `PUBLISH_PROVIDER=server`) `ServerPublishProvider` writes them to the `gojoline-sites` volume (`sites/<slug>/<deployment>/`, a `current` symlink switched atomically, `resting.html` and `takedown.flag` markers, 2 deployments kept) and Caddy serves `https://<name>.<PUBLISH_BASE_DOMAIN>` from it read-only (`deploy/server/Caddyfile`), with on-demand certificates only for live sites (the runner's `/ask`). Sites move there with `scripts/republish-all.mts` (`/api/cron/republish`, `republishLive`). `CloudflarePublishProvider` stores them in R2 (`StorageProvider`, S3 API) and one Worker (`workers/sites/worker.ts`) serves `https://<name>.<PUBLISH_BASE_DOMAIN>` and customers' own domains (Cloudflare for SaaS) from the current deployment only; `VercelPublishProvider` (one project per site, `gojo-<name>.vercel.app`) is the fallback and the legacy host for sites not moved yet. Published sites never share a hostname with the app. While they share the parent domain (`afridea.et`), the app's login cookies are `__Host-` so a site can't plant one; a separate domain for customer sites is planned before a big launch.
- **Telegram** (`NotifyProvider`): bot sends form notifications; owners link their chat with a one-time code; simple edit commands go through the same agent.
- **Payments** (`PaymentProvider`): Manual (receipt upload + admin approval) now, Chapa next, international later. Chapa button component inside generated sites.
- **Safety**: Haiku-class content check on prompts and generated pages (brand/bank impersonation, credential collection, fake payment pages), verification before publish, report-abuse link, rate limits on free accounts.

- **Site dashboard v2 (2026-11-16)** (`app/[lang]/dashboard/[id]`, `components/dashboard`, `lib/dashboard`): five tabs; only the open tab's data is read.
  - **Visit counting** (`lib/visits`): the site template's beacon (`templates/site/src/lib/live.ts`, `navigator.sendBeacon`, text/plain so no preflight, key in the body) posts `{path, ref, src?, key}` (≤ 300 bytes) to `POST /api/public/sites/:id/visits` (site origins only, site key, Zod, 60 views/min per hashed IP, 204 at once, counting in `after()`). Skipped: `navigator.webdriver`, preview/sandbox hosts, prerendered or hidden pages until visible, and the owner (the dashboard's Open link adds `#me`, which sets a localStorage flag on the site). Visitor id = sha256(daily salt + site + IP + user agent); the salt is random, lives only in Redis (`gojo:v:salt:<day>`, 25 h). Redis per site per Addis day: `PFADD` people, `INCR` views, `HINCRBY` source and device on a person's first view; keys expire after 3 days. A daily Vercel cron (`/api/cron/visits`, `CRON_SECRET`, 00:20 Addis) rolls yesterday and the day before into `site_visits_daily`; reading the dashboard also tops up the last 3 days. Without Redis (dev, e2e) a memory counter stands in (`VisitCounter`).
  - **Business info** (`lib/site-info`, `site_settings.business`): owner-scoped, Zod with length limits. `GET /api/public/sites/:id/info` (site origins + key, `?key=` so a plain GET needs no preflight; cached 60 s) returns only what the owner chose to show, shaped like the template's `business` and `announcement`; the details are also baked into the pages at publish (`VITE_LIVE`), so the runtime copy re-renders only when something changed and late banner lines slide in over the page (no layout shift). Owners' text is content-checked before saving. The route limits by hashed IP first and reads through a one-minute per-server cache of the site joined with its details (`PublicSiteCache`), answered `private, max-age=60`. `sites.runtime_version` says whether the published files have this reader (null: publish once more; the dashboard says so).
  - **Share preview** (`site_settings.seo`): title, description, share picture and tab icon from the owner's photos, passed to the build as `VITE_SEO` at the next publish (crawlers don't run scripts).
  - **Offline** (`lib/publish/offline.ts`): `sites.offline_at` is the owner's switch, separate from an admin's `taken_down`. Forms refuse, `/info` says `offline`, and the live site shows a bilingual resting page; the publish provider is told too where it can (`setResting`: Cloudflare flags the pointer and the Worker answers pages with 503 + Retry-After; memory for tests; Vercel relies on the runtime check). A publish while resting keeps it resting. A takedown takes the project lock and its pointer is marked `takedown`, which the resting switch never overwrites and the Worker always serves.
  - **Messages**: `form_submissions.status` new/replied/done (`lib/dashboard/message-status.ts`); `read_at` kept.

- **Growth loops (2026-11-18)** (`lib/growth`):
  - **Badge**: not part of the template. On plans that show it, publish adds `<gojoline-badge>` before `</body>` of every built page (after the checks): a declarative shadow root holds the pill and its CSS (the site's CSS can't reach in), and the host box carries inline `!important` declarations for every property that could hide it (inline `!important` beats any stylesheet). The link is `<app origin>/<page lang>?ref=site_<slug>&utm_*`. Publish refuses `styles.css` that names `gojoline-badge`.
  - **Sign-up sources**: the proxy keeps the first touch (`?ref=`, `utm_*` or the referring host) in the httpOnly first-party cookie `gojo_src` (90 days; replaced only by an invite link); Better Auth's `user.create.after` database hook (`AuthConfig.onUserCreated` → `lib/growth/signup.ts`) clears the cookie and, in `after()`, saves one `signup_sources` row (with HMAC hashes of the sign-up network and user agent) and links an invite. `SignupSourceStore.breakdown()` (index on `users.created_at`) feeds Admin → Overview.
  - **Referrals**: `referral_codes` (one code per owner), `referrals` (one row per invited owner: pending, rewarded or blocked) and `referral_rewards_monthly` (the inviter's count per month). `Billing.onApproved` calls `Referrals.onPaymentApproved` after a plan payment is applied: one SQL statement (one transaction) claims the row, counts the month under the monthly row's lock, writes both `credit_ledger` rows (reason `referral`) and both balances; then an audit row. The admin's payment review shows who invited the payer and flags a shared network. Rules in `referral-rules.ts`.
  - **Showcase**: `sites.showcase` and `showcase_hidden_at`; `site_showcase` holds the card saved at each publish from the published version (its name, and a 640×400 WebP of the built hero photo keyed by its hash). The list is cached (`unstable_cache`, tag `showcase`, 10 minutes) and expired at once on opt-in, hide, publish, takedown and resting. `/api/showcase/image/<hash>` serves a thumbnail only while a listed site uses it (`public, s-maxage=86400, stale-while-revalidate=604800`). Owner switch: `POST /api/projects/<id>/showcase`; admin hide: Admin → Growth.
  - **Sector pages**: `lib/landing/sectors.ts` (content per sector and language, mapped to a preset) rendered by `app/[lang]/website-for/[sector]` with WebPage and FAQPage JSON-LD; listed in the sitemap.

## Data model (initial)

`users`, `sessions`, `projects` (with the `template_id` it started from, if any), `project_versions`, `messages`, `ai_usage` (tokens, cost), `sites` (subdomain, domain, status), `form_submissions`, `list_items`, `uploads`, `telegram_links`, `plans`, `subscriptions`, `credit_ledger`, `payments` (method, amount_minor, currency, receipt_url, status, reviewed_by), `abuse_reports`, `audit_log`, `site_settings` (business info and share preview per project), `site_visits_daily` (views, people, sources, devices per project per day), `feedback` (owner_id, type idea/problem/praise/question, message, rating 1–5, page path, locale, device, user_agent ≤ 200, screenshot (WebP ≤ 1600 px) and thumbnail (~480 px) as bytea, screenshot_bytes for the per-owner caps, status new/seen/planned/done/wont_do, reply, replied_by/at, reply_read_at; migration 0017 with a partial index for unread replies; owner reads always filter by owner_id, pictures are read only by their route for the owner or an admin and cleared after 90 days by the daily cron; the admin save is one statement with its audit rows; `FeedbackStore` in `lib/feedback/`, memory store for dev and e2e), `signup_sources` (first touch per owner, migration 0018), `referral_codes`, `referrals` and `referral_rewards_monthly` (migration 0019), and the showcase columns on `sites` plus `site_showcase` (migration 0020).

## Environment variables

See `.env.example`. Secrets are set in the Vercel project and in the Claude Code cloud environment, never committed.

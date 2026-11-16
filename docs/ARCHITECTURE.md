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

- **Agent loop** (`lib/agent`): plan, then edit files with tools (`read_file`, `write_file`, `search_replace`, `list_files`, `run_build`, `read_errors`). Auto-fixes build errors up to 3 times. Only relevant files go into context; system prompt and template docs are cached. Streams progress to the UI. Logs tokens and cost per request.
- **Sandbox** (`SandboxProvider`, Vercel Sandbox first): a snapshot with the template's dependencies pre-installed so preview starts in seconds. The preview URL loads in an iframe.
- **Versioning**: each AI change creates a snapshot (files to R2, row in Postgres) that can be restored.
- **Gojoline Cloud**: one Postgres with rows scoped by `project_id` and checked on every query. Generated sites call a small public Data API (`/api/sites/:siteId/forms`, `/lists`, `/uploads`, owner login) with per-site keys and rate limits.
- **Publishing** (`PublishProvider`): production build becomes static files. `CloudflarePublishProvider` stores them in R2 (`StorageProvider`, S3 API) and one Worker (`workers/sites/worker.ts`) serves `https://<name>.<PUBLISH_BASE_DOMAIN>` and customers' own domains (Cloudflare for SaaS) from the current deployment only; `VercelPublishProvider` (one project per site, `gojo-<name>.vercel.app`) is the fallback and the legacy host for sites not moved yet. Published sites never share a hostname with the app. While they share the parent domain (`afridea.et`), the app's login cookies are `__Host-` so a site can't plant one; a separate domain for customer sites is planned before a big launch.
- **Telegram** (`NotifyProvider`): bot sends form notifications; owners link their chat with a one-time code; simple edit commands go through the same agent.
- **Payments** (`PaymentProvider`): Manual (receipt upload + admin approval) now, Chapa next, international later. Chapa button component inside generated sites.
- **Safety**: Haiku-class content check on prompts and generated pages (brand/bank impersonation, credential collection, fake payment pages), verification before publish, report-abuse link, rate limits on free accounts.

- **Site dashboard v2 (2026-11-16)** (`app/[lang]/dashboard/[id]`, `components/dashboard`, `lib/dashboard`): five tabs; only the open tab's data is read.
  - **Visit counting** (`lib/visits`): the site template's beacon (`templates/site/src/lib/live.ts`, `navigator.sendBeacon`, text/plain so no preflight, key in the body) posts `{path, ref, src?, key}` (≤ 300 bytes) to `POST /api/public/sites/:id/visits` (site origins only, site key, Zod, 60 views/min per hashed IP, 204 at once, counting in `after()`). Skipped: `navigator.webdriver`, preview/sandbox hosts, prerendered or hidden pages until visible, and the owner (the dashboard's Open link adds `#me`, which sets a localStorage flag on the site). Visitor id = sha256(daily salt + site + IP + user agent); the salt is random, lives only in Redis (`gojo:v:salt:<day>`, 25 h). Redis per site per Addis day: `PFADD` people, `INCR` views, `HINCRBY` source and device on a person's first view; keys expire after 3 days. A daily Vercel cron (`/api/cron/visits`, `CRON_SECRET`, 00:20 Addis) rolls yesterday and the day before into `site_visits_daily`; reading the dashboard also tops up the last 3 days. Without Redis (dev, e2e) a memory counter stands in (`VisitCounter`).
  - **Business info** (`lib/site-info`, `site_settings.business`): owner-scoped, Zod with length limits. `GET /api/public/sites/:id/info` (site origins + key, `?key=` so a plain GET needs no preflight; cached 60 s) returns only what the owner chose to show, shaped like the template's `business` and `announcement`; the live site merges it over its built-in content after hydration and keeps its own when the API can't be reached. `sites.runtime_version` says whether the published files have this reader (null: publish once more; the dashboard says so).
  - **Share preview** (`site_settings.seo`): title, description, share picture and tab icon from the owner's photos, passed to the build as `VITE_SEO` at the next publish (crawlers don't run scripts).
  - **Offline** (`lib/publish/offline.ts`): `sites.offline_at` is the owner's switch, separate from an admin's `taken_down`. Forms refuse, `/info` says `offline`, and the live site shows a bilingual resting page; the publish provider is told too where it can (`setResting`: Cloudflare flags the pointer and the Worker answers pages with 503 + Retry-After; memory for tests; Vercel relies on the runtime check). A publish while resting keeps it resting.
  - **Messages**: `form_submissions.status` new/replied/done (`lib/dashboard/message-status.ts`); `read_at` kept.

## Data model (initial)

`users`, `sessions`, `projects` (with the `template_id` it started from, if any), `project_versions`, `messages`, `ai_usage` (tokens, cost), `sites` (subdomain, domain, status), `form_submissions`, `list_items`, `uploads`, `telegram_links`, `plans`, `subscriptions`, `credit_ledger`, `payments` (method, amount_minor, currency, receipt_url, status, reviewed_by), `abuse_reports`, `audit_log`, `site_settings` (business info and share preview per project), `site_visits_daily` (views, people, sources, devices per project per day).

## Environment variables

See `.env.example`. Secrets are set in the Vercel project and in the Claude Code cloud environment, never committed.

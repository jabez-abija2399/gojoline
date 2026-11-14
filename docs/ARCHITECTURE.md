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
- **Publishing** (`PublishProvider`): production build becomes static files served under `*.gojoline.site` (Cloudflare Workers static assets + R2 first; Vercel as fallback), plus custom domains. Published sites never share a domain with `gojoline.com`.
- **Telegram** (`NotifyProvider`): bot sends form notifications; owners link their chat with a one-time code; simple edit commands go through the same agent.
- **Payments** (`PaymentProvider`): Manual (receipt upload + admin approval) now, Chapa next, international later. Chapa button component inside generated sites.
- **Safety**: Haiku-class content check on prompts and generated pages (brand/bank impersonation, credential collection, fake payment pages), verification before publish, report-abuse link, rate limits on free accounts.

## Data model (initial)

`users`, `sessions`, `projects`, `project_versions`, `messages`, `ai_usage` (tokens, cost), `sites` (subdomain, domain, status), `form_submissions`, `list_items`, `uploads`, `telegram_links`, `plans`, `subscriptions`, `credit_ledger`, `payments` (method, amount_minor, currency, receipt_url, status, reviewed_by), `abuse_reports`, `audit_log`.

## Environment variables

See `.env.example`. Secrets are set in the Vercel project and in the Claude Code cloud environment, never committed.

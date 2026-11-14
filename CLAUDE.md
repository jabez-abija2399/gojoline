# Gojoline: rules for Claude Code

Gojoline ("gojo" ጎጆ = home + online) is an AI builder that turns a chat in Amharic or English into a live website or simple web app, paid in Birr. Ethiopia first, built to serve everyone.

Read before working: `docs/PRD.md` (what), `docs/ARCHITECTURE.md` (how), `docs/ROADMAP.md` (what next), `brand/README.md` (look).

## How to work (autonomous mode)

- The founder wants work to continue without questions. Pick the next unchecked task in `docs/ROADMAP.md`, build it end to end, verify it, tick it, commit, push, then continue with the next.
- Decide sensible defaults yourself and record each decision in `docs/DECISIONS.md` (date, decision, why). Ask only when blocked on something only the founder can provide (a secret, a payment, a legal choice); then skip to the next task that is not blocked.
- Never fake results. If a service or secret is missing, build behind an interface, write the test with a clear skip message, and note it in `docs/ROADMAP.md` under "Blocked".
- Work on a feature branch (`build/<slice>`); push with `git push -u origin <branch>`. Keep `main` deployable.
- Before ticking a task: `npm run typecheck`, `npm run lint`, `npm test` pass, and for UI work `npm run e2e` (Playwright, `--trace off`) passes. Fix failures; never disable checks to get green.
- Small commits with clear messages. Update docs in the same commit as the code.

## Stack (fixed: do not swap without a decision entry)

- Builder app: Next.js (App Router) + TypeScript strict, Tailwind, shadcn/ui, deployed on Vercel.
- Database: Neon Postgres + Drizzle ORM. Migrations via `drizzle-kit`.
- Auth: Better Auth (email + phone).
- AI: Anthropic TypeScript SDK (`@anthropic-ai/sdk`), tool use, prompt caching, streaming. API key env var is `SAYSITE_ANTHROPIC_API_KEY` (pass it as `apiKey`; the SDK does not read that name by itself). Default model `claude-opus-5-5`; measure cost per task before adding cheaper models (`claude-sonnet-5-5`, `claude-haiku-5-5`).
- Sandbox: Vercel Sandbox behind `SandboxProvider`.
- Jobs and rate limits: Upstash (QStash/Workflow + Redis).
- Files and snapshots: Cloudflare R2 (S3 API) behind `StorageProvider`.
- Errors: Sentry. Analytics: PostHog (later).
- Generated customer sites: one fixed template, Vite + React + TypeScript + Tailwind + shadcn/ui, in `templates/site/`.

## Code rules

- Every user-facing string goes through i18n (`en`, `am`). No hard-coded UI text. Test layouts with Amharic.
- Mobile-first: every screen works at 360 px wide on a slow connection.
- External services sit behind interfaces: `SandboxProvider`, `PaymentProvider`, `LLMProvider`, `PublishProvider`, `StorageProvider`, `NotifyProvider`.
- Money is integer minor units plus a currency code. Never floats.
- Tenant isolation on every query (project and user scoped). Secrets only on the server. Validate all input with Zod.
- Log tokens and cost for every AI request; cache stable prompt parts; cap auto-fix retries at 3.
- Use brand tokens from `brand/tokens.css` / `brand/tailwind.preset.js`; logos and icons from `brand/`.
- Small files, clear names, tests for business logic.

## Safety

- Never delete Neon projects, branches or databases, Upstash databases, or Vercel projects. Never buy domains. Never change paid plans.
- Never commit secrets. Read them from env vars listed in `.env.example`.
- Telegram bot: @gojoline_bot (token in `TELEGRAM_BOT_TOKEN`).
- Chapa is postponed: keep `PaymentProvider` with the manual provider only; do not build Chapa until the roadmap says so.
- Abuse protection is part of Phase 1, not optional: content checks before publish, verification, report-abuse link.

## Commands

- `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run e2e` · `npm run db:generate` · `npm run db:migrate`

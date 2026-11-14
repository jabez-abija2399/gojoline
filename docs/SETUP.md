# Setting up Claude Code on the web to build Gojoline on its own

Everything in the repository is ready (`CLAUDE.md`, `.claude/settings.json`, `docs/ROADMAP.md`). These steps are the ones only the founder can do, because they involve accounts and secrets.

## 1. Permission mode: Auto

In the session, open the mode dropdown next to the prompt box and pick **Auto**. File edits never ask in cloud sessions; Auto also runs most other actions without asking. (Bypass mode is not offered in the cloud; command-line flags do not apply.)

The repo's `.claude/settings.json` already pre-approves the build tools (npm, git, node, Playwright, Drizzle) and the Neon, Vercel, Upstash and Sentry connectors, and blocks dangerous actions (force push, deleting databases or projects, buying domains, changing plans). It applies when the session has only this one repository.

## 2. Connectors (claude.ai/customize/connectors)

Connectors are read when a session starts, so add them first and then start a new session.

| Connector | Status | Used for |
| --- | --- | --- |
| GitHub | Connected (repo attached) | Code, branches, pull requests |
| Vercel | Connected | Deploy the builder, Vercel Sandbox, env vars |
| Neon | Connected | Database: create project, branches, migrations |
| Upstash | Connected | Redis rate limits, QStash jobs |
| Sentry | Connected | Error tracking |
| Cloudflare | Connected but deprecated | Replace with the current Cloudflare connector (`https://mcp.cloudflare.com/mcp`) for R2 storage and publishing sites |

Not needed now: Supabase (Phase 3), Gmail/Drive (not used for building).

## 3. Secrets (environment settings → Edit → Network secrets or environment variables)

Open the cloud environment menu in the session's title bar, then **Edit**. Add these by name (values never go in chat or in git):

| Name | Where to get it | Needed for |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys | The AI builder and evals (required) |
| `VERCEL_TOKEN` | vercel.com → Account → Tokens | Vercel Sandbox previews |
| `TELEGRAM_BOT_TOKEN` | Telegram → @BotFather → /newbot | Notifications and bot edits |
| `CHAPA_SECRET_KEY` | dashboard.chapa.co (test mode) | Payment button (sandbox) |
| `CLOUDFLARE_API_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID` | dash.cloudflare.com → R2 / API tokens | Storage and publishing |

`DATABASE_URL`, Upstash keys and Vercel IDs can be created by Claude through the connectors and stored in the Vercel project. A new session picks up new secrets.

## 4. Network access

Same environment settings → **Network access**. Choose **Full**, or **Limited** with these allowed domains (keep "Allow package managers" ticked):

`api.anthropic.com`, `*.neon.tech`, `*.vercel.com`, `*.vercel.app`, `api.vercel.com`, `*.upstash.io`, `api.telegram.org`, `api.chapa.co`, `*.cloudflare.com`, `*.r2.cloudflarestorage.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `*.sentry.io`

## 5. Setup script (optional, speeds up new sessions)

Same settings → **Setup script**:

```bash
cd /home/user/gojoline 2>/dev/null && [ -f package.json ] && npm ci --no-audit --no-fund || true
```

The repo also has a session-start hook that runs `npm install` when dependencies are missing.

## 6. Start building

Start a new session on this repository in **Auto** mode and send:

> Build Gojoline following CLAUDE.md and docs/ROADMAP.md. Work through the slices in order without asking me; commit and push each slice; keep going until the roadmap is done or everything left is blocked.

Long runs end when a session's limits are reached; start a new session with the same message and it continues from the roadmap.

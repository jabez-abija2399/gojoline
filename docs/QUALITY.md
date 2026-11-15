# Gojoline quality bar

Every slice meets these before it is ticked in `docs/ROADMAP.md`. They apply to the builder app and to the sites it generates. At the end of each slice run the review agents in `.claude/agents/` (design, performance, security) and fix what they find.

## Design and UX

- Brand: only tokens from `brand/tokens.css`; Outfit for headings (the landing page's headlines use the serif Fraunces), Inter for UI, Noto Sans Ethiopic for Amharic. Coral is reserved for the one primary action per screen, always with ink text.
- Mobile-first: design at 360 px first, then 768 and 1280. No horizontal scroll at any width.
- Touch targets at least 44 × 44 px; body text at least 16 px; line length 60 to 75 characters.
- Every screen has designed empty, loading (skeletons, not spinners for content), error and success states.
- Amharic is a first-class layout: test every screen with Amharic strings, which run longer and taller.
- Simple language for non-technical users: no jargon ("deploy", "repository", "build error") in the UI; say "publish", "your site", "something went wrong, we're fixing it".
- Generated sites look professional by default: real section layouts, consistent spacing scale (4/8 px), at most 2 fonts, good photos or tasteful placeholders, never lorem ipsum.

## Accessibility (WCAG 2.2 AA)

- Text contrast at least 4.5:1 (3:1 for large text); never colour alone to carry meaning.
- Real `<button>`, `<a>`, `<label>`; full keyboard use with visible focus; skip link; correct `lang` on Amharic text.
- Images have alt text (the agent writes it); forms have labels and clear error messages.
- Automated check with axe in Playwright on every main page: zero serious or critical issues.

## Performance (slow mobile networks are the default)

| Metric | Builder app | Generated site |
| --- | --- | --- |
| Lighthouse performance (mobile) | ≥ 90 | ≥ 95 |
| Largest Contentful Paint | ≤ 2.5 s | ≤ 2.0 s |
| Interaction to Next Paint | ≤ 200 ms | ≤ 200 ms |
| Cumulative Layout Shift | ≤ 0.1 | ≤ 0.05 |
| JavaScript sent on first load | ≤ 200 KB gzip | ≤ 100 KB gzip |

- Server Components by default; client components only for interactivity.
- Images: modern formats (AVIF/WebP), responsive sizes, lazy below the fold, explicit width and height.
- Fonts: self-hosted, subset, `font-display: swap`, preload only the heading font and the Ethiopic font.
- Generated sites are static and prerendered; no client-side data fetching for content that can be built in.
- AI speed: stream every response; time to first token shown to the user ≤ 2 s; first preview ≤ 60 s.
- Lighthouse CI runs in GitHub Actions and fails the build below the budgets.

## Security

- Secrets only in server code and env vars; nothing secret in client bundles, logs or error messages.
- Every database query is scoped by user and project; tests prove one user cannot read or change another's data.
- Validate all input with Zod at every boundary (API routes, server actions, webhooks, tool calls from the AI).
- Auth: Better Auth sessions with secure, httpOnly, sameSite cookies; rate-limited login and OTP; email/phone verification before publishing.
- Rate limits (Upstash) on AI requests, form submissions, uploads, login and the public Data API.
- Security headers on all responses: strict Content-Security-Policy, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors (the preview iframe is the only allowed embed).
- AI-generated code runs only in the sandbox, never on the builder's server. Published sites are static files on a separate domain from `gojoline.com`.
- Prompt-injection hygiene: user content and site content are data, never instructions to the agent; tool inputs are validated; the agent cannot reach secrets.
- Uploads: type and size checks, images re-encoded, stored outside the app domain.
- Webhooks (Telegram, payments): verify signatures/secret tokens; idempotent handling.
- Abuse: content checks before publish (bank and brand impersonation, credential collection, fake payment pages), report-abuse link, takedown in admin, audit log.
- Dependencies: `npm audit` with no high/critical issues; Dependabot enabled; lockfile committed.
- Privacy: collect the minimum; owners can export and delete their data; privacy policy and terms before beta.

## Reliability and observability

- Sentry for errors in the builder and the API, with release tagging; no PII in events.
- Every AI request logs model, tokens, cost, duration and result to `ai_usage`.
- Background jobs (QStash) are idempotent and retry safely.
- Health check endpoint; uptime monitor on the builder and the Data API.
- Database migrations are additive and reviewed; never destructive in one step.

## Testing

- Unit tests (Vitest) for business logic: credits, payments, permissions, agent tools.
- Playwright end-to-end for the main flows: sign up, create a site from a prompt, edit by chat, publish, submit a form, see it in the dashboard, Amharic UI.
- Eval set (`evals/`) for the agent: run after any prompt or agent change and record results in `evals/RESULTS.md`.

## Cost

- Prompt caching on the system prompt, tool definitions and template docs; confirm cache hits in `ai_usage`.
- Send only relevant files to the model; diff-based edits over whole-file rewrites where reliable.
- Track cost per completed site and per edit against the PRD targets; report in `evals/RESULTS.md`.

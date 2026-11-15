# Decisions log

| Date | Decision | Why |
| --- | --- | --- |
| 2026-11-14 | Name Gojoline (gojo + online) | Ethiopian meaning, global pronunciation, domains available |
| 2026-11-14 | Brand: globe + gojo cut-out mark, Terracotta Earth palette | Chosen by founder; distinctive and works small |
| 2026-11-14 | Builder: Next.js on Vercel; generated sites: Vite + React fixed template | Founder preference; fast previews and fewer AI mistakes |
| 2026-11-14 | Gojoline Cloud (shared Neon DB) instead of user-owned Supabase in Phase 1 | Non-technical users can't set up Supabase |
| 2026-11-14 | Manual Birr payments first, Chapa after business licence | No licence yet |
| 2026-11-14 | Anthropic key env var named `SAYSITE_ANTHROPIC_API_KEY` | Founder's existing key name; passed to the SDK explicitly |
| 2026-11-14 | Telegram bot is @gojoline_bot | Created by founder |
| 2026-11-14 | Chapa postponed | Founder decision; manual payments only for now |
| 2026-11-14 | Work on the session branch `claude/gojoline-implementation-o0jv0t` instead of `build/<slice>` branches | The cloud session may only push to its assigned branch; each slice is still its own set of commits |
| 2026-11-14 | Next.js 16.4 with Cache Components / PPR turned off | A strict nonce-based CSP needs per-request rendering; PPR's static shell can't carry a nonce. Pages are small, so dynamic rendering stays well inside the LCP budget |
| 2026-11-14 | CSP: nonce + `strict-dynamic` for scripts, `'unsafe-inline'` for styles only | React style attributes and next/font need inline styles; scripts are the XSS risk and stay nonce-only |
| 2026-11-14 | Locale in the URL (`/en`, `/am`), chosen by cookie then `Accept-Language` | Shareable links per language, correct `lang` and hreflang for SEO, no client JS for i18n |
| 2026-11-14 | Own tiny typed i18n (`lib/i18n`) instead of a library | Two locales, server-rendered; `am.ts` is type-checked against `en.ts` and a test checks keys match |
| 2026-11-14 | Noto Sans Ethiopic self-hosted as an 80 KB subset (core Ge'ez block, 400–700) | Google's Ethiopic file is 198 KB and pushed Amharic LCP to 3.6 s; the subset gives LCP 0.8 s |
| 2026-11-14 | Buttons and inputs at least 44 px tall, buttons may wrap | Touch-target rule and longer Amharic labels at 360 px |
| 2026-11-14 | Waitlist and rate limiter behind `WaitlistStore` / `RateLimiter` interfaces with memory implementations | Database (Slice 2) and Upstash come later; services are chosen in `lib/server/services.ts` |
| 2026-11-14 | Brand assets copied from `brand/` by `npm run brand:sync`; a unit test checks the copies match | `brand/` stays the single source of truth |
| 2026-11-14 | Amharic copy is drafted by the agent and must be reviewed by a native speaker before beta | No reviewer available during the build |
| 2026-11-14 | Rate limits fail closed on Vercel when Upstash is not configured | Per-instance memory limits are no real limit on serverless (security review) |
| 2026-11-14 | Client IP from `x-real-ip`, else the rightmost `X-Forwarded-For` hop | The leftmost hop is client-controlled and would let anyone reset their limit |
| 2026-11-14 | Builder frames nothing unless `CSP_FRAME_ORIGINS` lists the preview origin | A wildcard like `*.vercel.run` would allow framing anyone's sandbox |
| 2026-11-14 | GitHub Actions pinned to major tags (not SHAs) for now; Dependabot watches them | Workflow has read-only permissions and no secrets; revisit when deploy secrets are added |
| 2026-11-14 | Direct `@radix-ui/react-slot` instead of the `radix-ui` barrel; plain `<label>` | Cut first-load JS from 201 KB to 179 KB gzip (budget 200 KB) |
| 2026-11-14 | Site template is data-driven: the agent mainly edits a typed `src/site.ts`, validated by Zod + contrast checks | Fewer AI mistakes, small diffs (cheap edits), validation messages name the exact field to fix |
| 2026-11-14 | Template uses system font stacks plus the bundled Ethiopic subset; no web fonts for Latin | Zero font downloads for Latin on slow networks; QUALITY allows at most 2 fonts |
| 2026-11-14 | Published sites are prerendered per page and language (`/`, `/am/...`) and hydrated (77 KB gzip JS) | Static, SEO-friendly, and interactive enough for forms later; under the 100 KB budget |
| 2026-11-14 | Map section links to the maps app instead of embedding a third-party iframe | Keeps sites fast and private; no third-party scripts |
| 2026-11-14 | Manual agent loop (not the SDK tool runner) with tools list_files, read_file, write_file, search_replace, run_build | Full control over sandbox calls, the 3-attempt auto-fix cap, revert on failure and per-request cost logging |
| 2026-11-14 | Agent model `claude-opus-5-5` at effort `medium` with server-side refusal fallback (`fallbacks: "default"`) | Default model per CLAUDE.md; first live run built a bilingual site in 32 s for $0.064. Cheaper models only after evals measure cost per task |
| 2026-11-14 | AI cost stored as integer nano-USD | Money rule (no floats); cache-read prices are fractions of a micro-dollar per token |
| 2026-11-14 | Agent may write only `src/**` (ts, tsx, css) and `public/**` images; template core, package.json and configs are locked | No new dependencies or build-script changes from AI code (supply chain and sandbox escape surface) |
| 2026-11-14 | Each owner request starts a fresh model conversation with the current `site.ts` and a short text history | Avoids replaying long tool transcripts (cost) and history-editing problems with preserved thinking |
| 2026-11-14 | Vercel project `gojoline` created (team jabezabija2399's projects) for sandboxes and deployment | Separate from existing projects; Hobby plan has no sandbox failover regions |
| 2026-11-14 | Sandboxes start from a base snapshot and switch to `deny-all` network after setup | Preview ready in ~2.5 s; AI-written code can't reach the internet or our services |
| 2026-11-14 | Builder CSP allows frames from `https://*.vercel.run` (set via `CSP_FRAME_ORIGINS`) | Preview URLs are random per sandbox; they only ever come from our server, never user input |
| 2026-11-14 | Builder gated by `BUILDER_ACCESS_CODE` + anonymous owner cookie until Better Auth (Slice 2) | Slice 1 ships before accounts; an open builder would let anyone spend AI and sandbox credits |
| 2026-11-14 | Agent progress streamed to the browser as NDJSON from a route handler (`maxDuration` 300 s) | Simple, works through Vercel functions, no extra realtime service |
| 2026-11-14 | Versions are full snapshots of editable files; restoring creates a new version | History is never rewritten; restore is one write |
| 2026-11-14 | Fresh sandboxes copy the deployed template over the base snapshot | Snapshot only needs rebuilding when template dependencies change |
| 2026-11-14 | Locked template files are re-written before every build; only editable paths are saved in versions | Build-time code (site.ts is imported during validation) could otherwise change the schema or scripts (security review) |
| 2026-11-14 | Per-project lock in Redis (memory fallback) around agent runs and restores | Two serverless instances must not run two agents on one sandbox |
| 2026-11-14 | Sandbox boots in parallel with the first model call (`LazySiteSandbox`) | Cuts time to first token on cold sandboxes (performance review) |
| 2026-11-14 | `@lhci/cli` runs through an exact-pinned `npx` in CI, not a devDependency; `zod` overridden to ^4.6.7 | Keeps `npm audit` free of high findings |
| 2026-11-14 | Template: the first section heading is the page's h1 when there is no hero; report-abuse link always shown | One h1 per page; Phase 1 trust rule |
| 2026-11-14 | Neon project `gojoline` in aws-eu-central-1 (Frankfurt), Postgres 17 | Closest AWS region to Ethiopia; separate from the existing `saysite` project |
| 2026-11-14 | Migrations generated by drizzle-kit and applied through the Neon connector, recorded in `drizzle.__drizzle_migrations` | No database secret in shell commands; `npm run db:migrate` stays compatible |
| 2026-11-14 | DB tests run on PGlite (in-process Postgres) with the real migrations | Real SQL, no network or secrets, fast |
| 2026-11-14 | Passwordless sign-in: 6-digit code by Ethiopian mobile number or email (Better Auth phone-number + email-OTP plugins), codes hashed, 10 min, 5 attempts | Non-technical users; no passwords to forget. Server actions call `auth.api` so no auth client JS ships |
| 2026-11-14 | Code delivery behind `OtpSender`; real SMS/email provider blocked on founder | Never fake delivery; dev prints codes, e2e reads them through a route that only exists with `E2E=1` |
| 2026-11-14 | Versions stored as jsonb in Postgres until R2 is set up | R2 credentials are blocked; small sites fit easily |
| 2026-11-14 | Builder access code removed; builder requires a signed-in account | Real accounts replace the Slice 1 stopgap |
| 2026-11-14 | Better Auth's public OTP/password HTTP routes are disabled; codes go only through our server actions | Those actions carry the shared (Upstash) per-IP and per-contact limits; the built-in limiter is per instance (security review) |
| 2026-11-14 | Code verify limits keyed on contact+IP, with a looser per-contact ceiling | Strangers guessing must not lock the real owner out |
| 2026-11-14 | Auth instance created lazily; in production without DATABASE_URL/BETTER_AUTH_SECRET accounts are simply unavailable | Builds and CI never need secrets; no insecure defaults in production |
| 2026-11-14 | Publish fallback: Vercel static deployments, one Vercel project per site (`gojo-<slug>.vercel.app`), Vercel login wall off | R2/Cloudflare and the publishing domain are blocked; sites stay on a domain separate from the builder |
| 2026-11-14 | Every publish is scanned (no inline/third-party scripts, frames, `javascript:` links, outside form actions, password fields, eval) and served with a strict CSP | AI-written code must not turn into phishing or malware pages |
| 2026-11-14 | Site address can't change after the first publish; reserved words (bank, telebirr, admin...) refused | Saved links keep working; fewer impersonation addresses |
| 2026-11-14 | Publish requires a verified account and takes the project lock | Phase 1 verification rule; no publish in the middle of an edit |
| 2026-11-14 | Publish-time settings (site URL, report link) passed as `VITE_*` build env to a locked template file | The agent can't remove the report link or fake the canonical URL |
| 2026-11-14 | Custom domains via the site's Vercel project with DNS instructions (A for apex, CNAME for subdomains, TXT when verification is needed); gated by plan entitlements | Paid feature per PRD; free for nobody until billing exists |
| 2026-11-14 | Site content moved from `src/site.ts` to `src/site.json` (typed by a locked loader) | One source of truth that the agent, the owner dashboard, Telegram edits and the publish step can all read safely without running code |
| 2026-11-14 | The agent may edit only `src/site.json`, `src/styles.css` and owner images; all code is locked and re-synced before every build | Agent-written components ran at build time and could emit server code or host config (security review, critical); every script on a published site is now our template code |
| 2026-11-14 | Published sites: strict file-path allowlist, `vercel.json`/`api/` dropped by the provider, `img-src 'self' data:` | No server functions or routing rules from site output; no data leaving through image URLs |
| 2026-11-14 | Address reserved in our database before the first deploy; hosting projects reused only by saved ID; live URL read from the host | Two owners can't race for one address; never deploy over someone else's project |
| 2026-11-14 | `sites.project_id` is ON DELETE RESTRICT | A project with a live site can't vanish and leave an untraceable site online |
| 2026-11-14 | Data API: public endpoint only for form answers; lists stay static and are edited in the owner dashboard, which saves a version and republishes | Lists render in prerendered HTML (fast, no client fetching per QUALITY); price changes still go live in seconds |
| 2026-11-14 | Form answers checked against the form definition captured at publish, plus site key, exact site origin, honeypot, timing and per-visitor/per-site limits | A public endpoint must not accept arbitrary data or become a spam relay |
| 2026-11-14 | Owner photos are re-encoded to WebP (max 1600 px, metadata stripped) with sharp and stored in Postgres until R2 exists | Uploaded bytes are never served as-is; small sites fit easily |
| 2026-11-14 | Owner dashboard is the same account as the builder (no separate owner login) | One login for non-technical owners |
| 2026-11-14 | CSV export prefixes cells starting with = + - @ and adds a BOM | Prevents spreadsheet formula injection from visitor answers; Excel shows Amharic correctly |
| 2026-11-14 | Bot checks (honeypot, timing) run before the site's daily answer limit; IPv6 visitors limited per /64; 30 answers per visitor per day | Junk traffic must not lock real customers out (security review) |
| 2026-11-14 | Per-user photo storage quota (150 MB) and unchanged list edits skip build/republish; list edits limited to 20/hour | Storage and deploy quota abuse (security review) |
| 2026-11-14 | Header actions become icon buttons with labels under 640 px | Everything fits at 360 px without overlapping touch targets |
| 2026-11-14 | Telegram linking via one-time deep-link codes (hashed, 15 min, single use) from the dashboard; private chats only | No typing of codes; a group can never receive answers or control a site |
| 2026-11-14 | Webhook verified with Telegram's secret-token header, idempotent by update_id, work done with `after()` | Telegram retries; agent edits take ~30 s and must not block the reply |
| 2026-11-14 | Bot edits reuse the builder agent and republish live sites; 20 edits/hour per owner | Same quality and safety checks as the web builder |
| 2026-11-14 | Plans Free / Starter / Business with monthly edit credits in a ledger (idempotent grants, rollover capped at 2 months); one credit per AI edit, refunded when the edit fails | Simple to explain; owners never pay for a failed change |
| 2026-11-14 | Manual payments: owner sends the Telebirr/bank transaction number (+ optional receipt photo); admins approve or reject; every decision audited; a reference can be used once | Chapa is postponed; this works today with no gateway |
| 2026-11-14 | Admins are set by env (`ADMIN_EMAILS`/`ADMIN_PHONES`) and must be verified; the admin page answers 404 to everyone else | No admin role table to manage yet; nothing to discover for attackers |
| 2026-11-14 | Plan limits enforced in the server: live sites per plan at publish, monthly form answers per site, Telegram notifications (Starter+) and Telegram edits (Business) | Limits can't be bypassed from the client |
| 2026-11-15 | Credits debited atomically through a `credit_balances` row (`balance >= 1` update in one statement with the ledger insert); charge happens before the request is saved | Parallel requests can't overspend; unpaid requests never enter chat history (security review) |
| 2026-11-15 | Refunds only for failures on our side, not when the owner aborts, and at most 5 a day | Stops failed/abandoned runs from becoming unlimited free AI (security review) |
| 2026-11-15 | Payment transaction numbers are canonical (A-Z, 0-9 only) and unique across methods; a receipt or SMS photo is required and admins see the customer's contact | One payment can't be claimed twice or by someone else (security review) |
| 2026-11-15 | One sender may use at most a tenth of a site's monthly form answers | Nobody can switch off a site's forms by exhausting its allowance |
| 2026-11-15 | Vercel functions pinned to `fra1` (`vercel.json`) | Neon is in Frankfurt; avoids ~90 ms per query across the Atlantic (performance review) |
| 2026-11-15 | Content safety: keyword rules (EN + AM) on every owner request and every published page, then a Haiku-class AI check on publish; AI errors block publishing (fail closed) | Abuse protection is Phase 1; keywords are free, the AI check costs well under a cent per publish and verdicts for unchanged text are reused |
| 2026-11-15 | Anyone can report a site at `/[lang]/report` (no account); reports are limited per network, stored with a salted network hash (no IPs) | Easy for the public, hard to flood, private |
| 2026-11-15 | Takedown marks the site in the database first (forms stop at once), then replaces the live site with a bilingual notice; the owner can't republish until an admin restores it; every action is audited | Works with any hosting provider; nothing deleted, so a mistake can be undone |
| 2026-11-15 | Admin panel tabs: payments, reports, sites, AI costs (30 days by use, day and user, from `ai_usage`) | One place for the founder's daily checks |
| 2026-11-15 | Unverified custom-domain claims older than 7 days are released when someone else connects that domain (DB and hosting); rollbacks keep the original claim date | Stops squatting without a background job |
| 2026-11-15 | Publish dialog keeps an address the owner typed when its info reloads | Typed address was being replaced after each save |

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

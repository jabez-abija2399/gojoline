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

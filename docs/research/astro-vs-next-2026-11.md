# Astro for customer sites, Next.js for the app? (2026-11-18)

The founder asked whether to use Astro for static sites and Next.js for the dynamic parts. This
looks at what each would change in Gojoline, with a working prototype and measurements, plus outside
research. Sources are at the end.

## What we have today

- **Builder app, dashboard, admin, landing page:** Next.js 16 on Vercel. It needs a server for
  every request (sign-in, the CSP nonce, AI streaming, payments), so it is the dynamic half already.
- **Customer sites:** one locked Vite + React template. The AI writes only `site.json` and
  `styles.css`; every page is prerendered to HTML per language and then **fully hydrated**: the
  browser downloads React and the whole page's components again to make about 16 small things
  interactive (forms, gallery lightbox, tabs, menu filter, marquee, count-up numbers, the late
  banner and business-hours update, the visit counter).

So the split the founder describes (static sites, dynamic app) is already the architecture. The
real question is **how the static sites are built and how much JavaScript they send**.

## Measured: the café starter, 8 pages (en + am)

Same content, same locked React sections, served gzipped, Lighthouse mobile (slow 4G, mid phone),
three runs each, home page.

| Build | JS sent | Page weight | First paint | LCP (budget 2.0 s) | Score |
| --- | --- | --- | --- | --- | --- |
| Today: Vite + React, full hydration | 95.5 KB gzip (322 KB raw) + 8.6 KB page data | 307 KB | 1.37–1.41 s | **2.29–2.47 s** (over) | 97–98 |
| Astro 7.4, static, no JS | 0 | 209 KB | 0.75 s | **1.73 s** | 99–100 |
| Astro 7.4, React islands for the interactive sections | 93 KB (React + sections, loaded when seen) | 363 KB | 1.21–1.51 s | 2.11–2.71 s | 96–99 |
| **Today's Vite output with hydration removed** | 0 | 210 KB | 0.75 s | **1.73 s** | 99–100 |

What this shows:

1. **The win comes from not hydrating, not from Astro.** Today's build with the hydration script
   removed scores exactly the same as Astro's static output (LCP 1.73 s, first paint 0.75 s).
2. **Islands done the obvious way are worse than today.** Each Astro island is its own React root,
   so React context (`SiteProvider`) does not cross islands; every island needs the site data as a
   prop, and Astro writes those props into the HTML. Five islands made the home page's HTML grow
   from 7 KB to 66 KB gzip, and React still loads. Islands only pay off with small, purpose-built
   props or no framework at all.
3. **Today's sites are over budget**: LCP 2.3–2.5 s against our 2.0 s target, and 95.5 KB of JS
   against the 100 KB limit (it was 77 KB when the template started; every new section adds to
   it). Alex Russell's 2024 budget for a content site that loads in 3 s on a mid-range phone is
   about 75 KB of JS; Ethiopian visitors mostly have cheaper phones than his reference device.
4. **Build time:** the Astro prototype built 8 pages in 2.6 s; today's pipeline takes 5.3 s, but
   that includes the type check and site validation, which Astro would still need. The difference
   in the AI's preview loop would be small.

## Outside research (short)

- **Astro today:** version 7 (June 2026; 7.4.12 on 13 Nov), Vite 8, faster builds, MIT licence.
  **Cloudflare acquired Astro on 16 Jan 2026**; the team joined Cloudflare, Astro stays open
  source and deployable anywhere, and its dev tooling now leans on Cloudflare's runtime (workerd)
  when the Cloudflare adapter is used. Our published sites already run on Cloudflare (R2 + Worker),
  and static Astro output needs no adapter.
- **What AI builders ship:** Bolt and Hostinger Horizons ship Vite + React; v0 ships Next.js;
  Framer and Wix render on the server and hydrate React; Webflow ships static HTML plus a small
  runtime. Lovable shipped client-only React and was criticised for SEO; since May 2026 new
  Lovable projects render on the server (TanStack Start). No major builder ships Astro.
- **Real-world speed:** sites built with Astro pass Core Web Vitals more often than Next.js or
  WordPress sites in the public CrUX data (Astro's own 2023 report; a 2026 CrUX analysis puts
  Astro at 67% against 49% for WordPress). The reason is the same as in our test: less JavaScript.
- **Ethiopia:** about 13 Mbps median on Ethio Telecom, 33 Mbps on Safaricom (2025–26 reports);
  data roughly USD 0.5–0.7 per GB and rising (Safaricom raised prices in Dec 2025); 94–97% of
  mobile web traffic is Android. Every KB matters more here than in the markets the big builders
  tune for.
- **Risks of Astro for us:** a second framework for the team; React context patterns break across
  islands (the fix is a store library); AI models know React and Next.js best, but our AI only
  edits JSON and CSS, so that risk falls on our own code, not on the AI's output.

## Options

| | A. Move the template to Astro | **B. Keep Vite + React, stop full hydration** | C. Leave as is |
| --- | --- | --- | --- |
| Speed for visitors | Best (measured) | **Same as A (measured)** | Over budget (LCP, JS) |
| Work | Rewrite page shell, preview, prerender, publish, validation, sandbox snapshot, 16 interactive parts | Rewrite the 16 interactive parts as small scripts (or hydrate only those parts); drop full-page hydration and the page data | None |
| Risk | New framework, new preview server in the sandbox, re-test every template | Small, inside the locked template we own | Sites get slower as sections grow |
| Old sites | Need a rebuild on next publish | Need a rebuild on next publish | — |

**Moving the landing page to Astro** as well was considered and is not recommended: it reads the
session cookie and needs the per-request CSP nonce, shares the header, footer, translations and
brand with the app, and already meets its own budget. Two apps for one product would mean two
deployments and duplicated UI for little gain.

## Recommendation

Keep the split we have: **Next.js for the app, static files for customer sites.** Do not switch
the customer-site template to Astro now: **option B gets the same measured speed** (LCP 2.4 s →
1.7 s, 95 KB → an estimated 10 KB of JS for the small scripts) with a fraction of the work and no new framework. Revisit Astro
if the template grows features that need per-page islands at scale (for example online ordering or
bookings with live availability), where Astro's islands, server islands and Cloudflare deployment
would earn their keep.

Prototype files (not committed): Astro 7.4.12 + @astrojs/react 7.1.9, rendering the locked
`App`/sections unchanged; measurements from Lighthouse 13 (simulated slow 4G, 4x CPU slowdown).

## Sources

astro.build/blog/astro-7 · astro.build/blog/astro-6 · registry.npmjs.org/astro ·
blog.cloudflare.com/astro-joins-cloudflare · docs.astro.build (framework components, sharing
state between islands, Cloudflare guide, styling) · astro.build/blog/2023-web-framework-performance-report ·
corewebvitals.io state-of-cwv · lovable.dev/faq/seo · docs.lovable.dev (upgrade to TanStack Start) ·
hostinger.com Horizons overview · infrequently.org/2024/01/performance-inequality-gap-2024 ·
speedgeo.net/statistics/ethiopia · addisfortune.news (Safaricom speed report) ·
researchictafrica.net RAMP Q1 2025 · shega.co (Safaricom price rise, Dec 2025) ·
gs.statcounter.com (Ethiopia mobile OS) · devclass.com (framework bake-off with Claude Code, Nov 2026)

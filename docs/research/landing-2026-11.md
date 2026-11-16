# Landing pages of AI builders: what they do, what we took (2026-11-16)

Research for the landing page's motion, interactive sections and signed-in behaviour. Sources are
the products' own pages and docs, design galleries and teardown articles. lovable.dev and v0.app
refuse automated browsers, so they were read through their docs and pattern galleries. A fetched
page shows text, not motion, so "what moves" is often our reading of it (marked *inferred*).

## What each one does

| Product | Hero | How it shows the product | Signed-out header |
|---|---|---|---|
| Lovable | One large prompt box over a grainy gradient | The prompt box is the product | Log in, Get started |
| v0 | Centred prompt, model picker, template chips | Same prompt as the app | Sign in |
| Bolt | "What will you build today?", prompt with Website/App/Slides tabs | Logo row, no testimonials | Sign in, Get started |
| Framer AI | "Get started for free", 36 s demo video | A scripted agent transcript ("Thinking…", "Created a design plan") | Log in, Sign up |
| Webflow | Headline over desktop and tablet mock-ups | Persona tabs, metric-led testimonials | Log in, Get started |
| Durable | "Get online in 30 seconds" | Industry slideshow, a simulated stream of leads | Start for free |
| Wix AI | Prompt-to-site with sample sites | Has a visible "stop animation" control | Create with AI |
| Hostinger Horizons | Manual vs Agentic tabs | Template gallery with filter tabs | Log in |
| Replit | "What will you build?" with category chips | Mock chat, testimonial carousel, Monthly/Yearly toggle | Log in, Sign up |
| Base44 | "I want to build…" with App/Website/Store chips | Static pricing | Start building |
| Zite | Headline beside a live-looking app and chat panel | Use-case tabs, industry grid | Sign in, Create account, Dashboard |
| Linear, Raycast, Stripe | Product as the hero; a live-feeling activity feed; Stripe's WebGL gradient | Fade-up reveals, tabbed grids | — |

## Patterns worth copying, ranked

1. **The prompt box is the call to action**, with example chips (Bolt, Replit, Base44). *Gojoline had it.*
2. **A scripted build that plays itself**: a message types, the site assembles (Framer, Zite). *Added: the hero demo cycles through businesses, types the owner's message and ticks the build steps.*
3. **A still first frame, motion after** (Stripe's fallback image, Wix's stop control). *Added: the first view is still; the demo has a pause button and never plays under reduced motion.*
4. **Reveal on scroll with CSS view timelines**, which runs off the main thread. *Had it; added a steps line that draws as you scroll and a reading-progress bar (CSS only).*
5. **Use-case tabs** (Zite, Hostinger, Raycast). *Had them (business chips, feature tabs).*
6. **A CSS-only marquee** that pauses on hover. *Added: every business type Gojoline has a template for.*
7. **A live-feeling feed** ("New booking on Telegram"). *Had it in the demo.*
8. **Before/after slider.** Nobody we saw does it for "your message vs your site". *Added, built on a native range input so keyboards and screen readers work.*
9. **A pricing toggle.** *Not added: Gojoline sells monthly and yearly but the yearly saving is small; later.*
10. **Numbers that count up**, with the real number in the HTML. *Added (CSS-safe width, real value without script).*
11. **A glowing border on the prompt** (@property gradient). *Not added: it repaints every frame, costly on cheap Android.*
12. **Drawn SVG lines.** *Added: the headline's brush stroke draws itself once.*

## What we avoided, and why

- **WebGL or canvas backgrounds** (Stripe, Lovable-style): GPU and JavaScript cost, battery drain, and they would break the 200 KB budget.
- **Autoplaying video** (Framer, Emergent, Hostinger): data cost on slow connections; our rule is no autoplay video.
- **Fake urgency or inflated numbers** (countdown timers, "85% off", contradictory "10M+ / 11M+"): our numbers are the measured ones, dated.
- **Scroll-jacking or smooth-scroll libraries:** they fight the phone's own scrolling.
- **Content hidden until a script runs:** on a slow phone it may never show. Everything here is visible without script.

## Signed-in visitors

The leading builders either turn the same address into the app (Lovable, Bolt: the dashboard with
the prompt box) or keep the marketing page and swap the header to "Dashboard" (Zite, Pulumi).
Gojoline keeps the marketing page and swaps every way in: the header says "Your sites" / "Open
Gojoline", prices say "Choose this plan" (to Plan and payments), template cards and the closing
button open Your sites, and a description typed in the hero goes straight to Your sites. The check
reads only whether a session cookie exists (no database call), so the landing page stays fast; the
pages behind it still check the real session.

## Sources

Lovable: saasui.design/pattern/landing/lovable, docs.lovable.dev/introduction/dashboard-overview ·
v0: saasui.design/pattern/landing/v0, v0.dev/changelog · bolt.new, support.bolt.new ·
framer.com, framer.com/ai · webflow.com · durable.com · wix.com/ai-website-builder ·
hostinger.com/ai-website-builder, hostinger.com/horizons · replit.com, docs.replit.com changelog ·
base44.com · zite.com · emergent.sh · linear.app · raycast.com · stripe.com ·
developer.chrome.com/blog/scroll-animation-performance-case-study ·
webkit.org/blog/17333/webkit-features-in-safari-26-0

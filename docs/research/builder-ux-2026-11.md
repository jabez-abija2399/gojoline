# Signed-in area: what other AI builders do (2026-11-16)

Research for the redesign of "Your sites" and the builder. Sources are product docs, changelogs,
review sites and user forums; Lovable and Replit block automated browsers, so their screens were
read from their own documentation, not opened.

## What Gojoline had (audit, 360 px and 1366 px, EN and AM)

- "Your sites" stacked three blocks of equal weight: a list of sites, a "Build another site" form,
  and twelve icon tiles. On a phone the templates pushed the page past 1,900 px.
- Site cards showed a letter and a date and time, but not whether the site was live.
- Plan, sign out and language were small links in a top bar; on phones only icons.
- How many AI changes were left was only on the Plan page. Running out was a surprise.
- Undo existed only in the Versions tab ("Bring back").
- The site dashboard and Plan page each had their own header with a back link.

## What the leading builders do

| | Home / dashboard | Builder |
|---|---|---|
| Lovable | Sidebar: workspace + credit bar, New, Search, Projects, recent projects; greeting over one prompt box (attach, voice, Build/Plan mode); tabs My projects / Recently viewed / Templates; thumbnail cards with a Published badge | Chat beside preview; Publish top right; free "Try to fix"; free inline text edits |
| v0 | Sidebar of chats grouped by project with live status | Design mode in the input |
| Bolt | "+" menu, "Enhance prompt", voice; token balance above the chat (opt-in) | Version per prompt, restore free |
| Base44 | Credits shown at the top of the page | Revert under each AI message; phone: full-screen preview with "Chat to edit" |
| Emergent | Agent picker, attach, import | Rollback on every message |
| Durable, Wix | Three questions or a short chat instead of a blank box | — |

Sources: docs.lovable.dev (dashboard-overview, editor, preview-toolbar, chat), v0.app/changelog,
support.bolt.new (chat-tools, maximizing-token-efficiency), docs.replit.com changelog 2026-07-24,
docs.base44.com (app-editor-overview, Credits), emergent.sh/docs/checkpoints-undo-anything,
techradar.com review of Durable, support.wix.com (Harmony / Aria).

## What users complain about most

1. Error loops that burn credits (Lovable and Bolt Trustpilot reviews).
2. No refund when the AI caused the mistake.
3. Usage that is hard to predict (Vercel community: "$30 recharge vanished within 2 days").
4. Non-developers stuck at the first error they can't fix.
5. Undo that doesn't really undo, or costs extra (Replit and Figma forums).
6. Running out of credits locks everything.

## What Gojoline took

1. One prompt box first, with a greeting and idea chips under it (Lovable). Done.
2. Navigation in one place: sidebar on large screens, drawer on phones (Lovable). Done.
3. Changes left always in sight: phone header, sidebar meter, under the message box (Lovable, Base44). Done.
4. Free undo under the newest change (Base44, Emergent). Done.
5. Site cards with a Live badge and a Visit link (Lovable). Done.
6. Templates shown as pictures of the real sites (Lovable templates tab). Done.

Later, not built yet: voice input (useful for Amharic typing), a "your site is ready" notification
for slow connections, a free "Try to fix" button, tap-to-edit text in the preview, real thumbnails
of each owner's site.

# Agent eval results

## 2026-11-14 (later) · after moving content to `site.json` and locking code · 6-case subset

| Metric | Result |
| --- | --- |
| Success (cases that got a sandbox) | 4/4 first try; edits 4/4 |
| Median cost, first generation | $0.140 (JSON is more verbose than TS; starter now includes a booking form) |
| Median cost, edit | $0.034 |
| Median time to first preview | 41.5 s |
| Median time to first token | 6.9 s (first token is usually the tool call; the UI shows progress steps immediately) |

2 of 6 cases could not start: Vercel Sandbox Hobby plan allows 10 sandboxes at once (see ROADMAP "Blocked"). Not an agent failure.

Run with `npm run evals` (real model, real Vercel Sandboxes; costs money). Full outputs, including every generated `site.ts` for Amharic review, are saved in `evals/.runs/` (not committed).

## 2026-11-14 · claude-opus-5-5 (effort medium) · 30 cases (15 EN, 15 AM), 10 with a follow-up edit

| Metric | Result | Target (PRD) |
| --- | --- | --- |
| Build success on first try | **100%** (30/30) | ≥ 90% |
| Build success after auto-fix | **100%** | ≥ 98% |
| Edit success | **100%** (10/10) | – |
| Median cost, first generation | **$0.086** (max $0.122) | ≤ $0.50 |
| Median cost, edit | **$0.031** (range $0.023–0.052) | ≤ $0.03 ⚠️ |
| Median time to first preview | **34 s** (max 46 s) | ≤ 60 s |
| Amharic correct and natural | Not yet reviewed by a native speaker | ≥ 90% |
| Total run cost | $2.80 | – |

Both vague prompts ("I need a website", "ድረ-ገጽ እፈልጋለሁ") correctly got clarifying questions instead of an invented site.

Follow-ups from this run:
- Edit cost is just above target. Edits that used `write_file` cost the most ($0.04–0.05); the system prompt now requires `search_replace` for edits, and the sandbox now boots in parallel with the first model call. Re-run to confirm.
- Cache hits and time to first token are now recorded per case (`cacheHitRate`, `medianFirstTokenSeconds`); the live integration test already showed cache reads of ~8K tokens on every turn.
- Amharic review: give `evals/.runs/<latest>.json` to a native speaker and record the score here.

| Case | First try | Cost | Seconds | Edit | Edit cost |
|---|---|---|---|---|---|
| en-cafe | yes | $0.084 | 31 | yes | $0.025 |
| en-restaurant | yes | $0.094 | 36 | – | – |
| en-hotel | yes | $0.097 | 43 | yes | $0.023 |
| en-clinic | yes | $0.081 | 29 | – | – |
| en-school | yes | $0.095 | 35 | yes | $0.037 |
| en-shop | yes | $0.088 | 33 | – | – |
| en-church | yes | $0.086 | 32 | – | – |
| en-events | yes | $0.086 | 34 | yes | $0.043 |
| en-ngo | yes | $0.112 | 44 | – | – |
| en-realestate | yes | $0.090 | 35 | – | – |
| en-tour | yes | $0.107 | 42 | yes | $0.052 |
| en-salon | yes | $0.081 | 33 | – | – |
| en-garage | yes | $0.074 | 32 | – | – |
| en-bakery | yes | $0.096 | 36 | – | – |
| en-vague | yes (asked) | $0.004 | 6 | – | – |
| am-cafe | yes | $0.055 | 25 | yes | $0.024 |
| am-restaurant | yes | $0.076 | 33 | – | – |
| am-hotel | yes | $0.101 | 37 | yes | $0.041 |
| am-clinic | yes | $0.081 | 30 | – | – |
| am-school | yes | $0.079 | 31 | – | – |
| am-shop | yes | $0.078 | 28 | yes | $0.023 |
| am-mosque | yes | $0.074 | 29 | – | – |
| am-events | yes | $0.080 | 34 | – | – |
| am-ngo | yes | $0.094 | 34 | yes | $0.023 |
| am-realestate | yes | $0.093 | 36 | – | – |
| am-tour | yes | $0.122 | 46 | – | – |
| am-salon | yes | $0.078 | 30 | yes | $0.031 |
| am-tailor | yes | $0.089 | 34 | – | – |
| am-pharmacy | yes | $0.080 | 35 | – | – |
| am-vague | yes (asked) | $0.021 | 7 | – | – |

## 2026-11-15: edit cost with lower effort for edits

10 cases with an edit (5 EN, 5 AM), `claude-opus-5-5`, edits at effort "low" (first builds stay "medium").

| Metric | Before (effort medium) | After (edits at low) | Target |
|---|---|---|---|
| First try success | 100% | 100% | ≥ 90% |
| Edit success | 100% | 100% | |
| Median cost, first site | $0.122 | $0.089 | ≤ $0.50 |
| Median cost per edit | $0.0321 | **$0.0295** | ≤ $0.03 |

Edits: about half of the remaining cost is writing the site (~2.7k tokens) to the prompt cache; the rest is output. Still open: the Amharic quality score needs a native-speaker review of `evals/.runs/`.


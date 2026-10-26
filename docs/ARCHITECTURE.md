# Architecture

Utsav is a three-package TypeScript monorepo. The design rule is simple: **the AI reads and
writes words; a deterministic engine decides everything with a number or a date in it.**

```
┌────────────────────────────── browser ──────────────────────────────┐
│  client (React)                                                     │
│   StartScreen ─► BriefForm ─► PlanDashboard (lazy chunk)            │
│        │              │              │                              │
│        │              └─ completeBrief ─► buildPlan ◄── @utsav/core │
│        │                                   (pure, ~30 µs)           │
│   localStorage ◄── usePlanner (versioned, validated SavedPlan)      │
└────────┼──────────────────────────────────────────┼─────────────────┘
         │ POST /api/extract                        │ POST /api/ideas
┌────────▼──────────────────────────────────────────▼─────────────────┐
│  server (Express 5) — the trust boundary                            │
│   security headers · 16 KB body cap · rate limit (proxy-resolved IP) │
│   Zod request schemas · resolveToday (±1 day of server clock)       │
│                                                                     │
│   extract: pattern screen ─► [LLM judge ∥ extractor] ─► Zod ─►      │
│            normalizeDraft (core) ─► findMissingFields (core)        │
│   ideas:   completeBrief (core) ─► buildPlan (core) ─► Gemini ─►    │
│            Zod per idea ─► validateIdeas against the plan           │
│                                                                     │
│   TTL cache (500 entries, 15 min) · Gemini adapter (retry, model    │
│   fallback, 15 s timeout, schema-constrained JSON)                  │
│   serves packages/client/dist (immutable assets, no-cache shell)    │
└─────────────────────────────────────────────────────────────────────┘
```

## Packages

| Package         | Responsibility                                                                    | Depends on                                     |
| :-------------- | :-------------------------------------------------------------------------------- | :--------------------------------------------- |
| `@utsav/core`   | Planning engine and planning knowledge. Pure functions; the clock is a parameter. | nothing                                        |
| `@utsav/server` | HTTP API, the Gemini key, every model call and its validation, static hosting.    | core, express, zod, @google/genai, compression |
| `@utsav/client` | The host's UI and persistence. Builds plans locally.                              | core, react                                    |

## The engine (`packages/core`)

`buildPlan(brief, plannedOn)` composes small modules, each independently tested:

1. **`derivePlanningContext`** — flattens the brief into facts every rule can read: days until
   the event, lead status (`comfortable` / `tight` / `rushed` against the template's lead window),
   budget per guest and tier, month, Indian season, peak wedding season, weekend.
2. **`allocateBudget`** — template shares (basis points summing to 10 000) → priority boost (×1.3)
   → renormalise everything except the contingency reserve → **largest-remainder rounding** so the
   rupees sum to the total exactly.
3. **`assessFeasibility`** — per-guest floors; for each shortfall, the guest count the allocation
   covers and the total budget that would cover everyone.
4. **`scheduleTasks`** — applicable tasks (declarative `when` conditions) are dated with
   `compressOffset`: the final half of the remaining time keeps real scale and earlier work is
   squeezed proportionally into the first half. The mapping is continuous and increasing, so
   no task jumps ahead of one that should follow it. Tasks whose latest workable point has passed
   are due now and flagged **at risk**.
5. **`buildVendorChecklist`** — applicable vendors, a book-by date on the same compression curve,
   fee = category allocation × vendor share, advance = fee × typical deposit.
6. **`rankIdeas`** — hard filters (setting, audience, affordability by tier), weighted score
   (style 3, each shared interest 2, setting 1, audience 1), stable tie-break, at most two per
   category, six in total, with the reasons that scored.
7. **`evaluateInsights`** — 13 declarative rules over the context, interpolated and ordered by severity.

Progress is separate from the plan: `summarizeProgress` and `summarizeSpending` take the plan
plus the host's ticks, statuses and spend, and `today`, and return overdue items, the next three
tasks, a readiness score (60% tasks, 40% vendors) and reallocation moves.

### Planning knowledge is data

`catalog/events/*.ts` hold the templates: budget categories, tasks, vendors and ideas, written
as plain objects with declarative conditions such as `OPEN_AIR` or `guestsAtLeast(150)`. Adding
an event type is a new data file plus one line in `registry.ts`; no engine code changes.
`registry.test.ts` holds the invariants every template must satisfy.

## Request lifecycle: extraction

1. Zod validates `{ description: 15–2000 chars, today: YYYY-MM-DD }`; `resolveToday` accepts the
   browser's date only within a day of the server's.
2. **Pattern screen** (`detectInjection`): a blatant attempt returns 422 with **no model call**.
3. Cache lookup by SHA-256 of `(description, today)`; a hit returns immediately.
4. **In parallel**: the LLM judge (`buildGuardRequest`) and the extractor (`buildExtractionRequest`).
   If the judge says `manipulation`, the extraction is discarded (422).
5. The extraction is parsed with Zod, normalised by `normalizeDraft` (closed vocabularies, integer
   bounds, priorities limited to the event type's categories), and `findMissingFields` lists the
   questions still to ask.

## Request lifecycle: AI ideas

1. Zod checks the envelope; `completeBrief` (the same validator the form uses) checks the brief.
2. Name and city are pattern-screened.
3. The server **rebuilds the plan** with `buildPlan` — browser numbers are never trusted.
4. Gemini receives the facts, the funded categories with amounts, and the ideas already shown;
   its schema allows only this plan's category ids.
5. Each idea is parsed alone (one bad idea does not sink the rest) and must pass
   `validateIdeas`: real category, cost ≤ 60% of it, no links or contact details, no
   instruction-like text, not a repeat.

## Persistence

`SavedPlan` (version 1) stores the brief, the planning date and the host's progress — never the
computed plan, which is rebuilt on load so a saved plan always reflects current rules. On load the
stored brief goes back through `completeBrief`; malformed entries are dropped field by field.
Editing a brief keeps progress unless the event type changes (every id would change).

## Deployment

One Cloud Run service built from the `Dockerfile`: a multi-stage build that ships only the server's
production dependencies and the three `dist` folders, runs as the `node` user, and serves the client
from the same origin as the API. `GEMINI_API_KEY` comes from Secret Manager.

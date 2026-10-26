# 🎉 Utsav — GenAI event planner for weddings, birthdays and community events

**Describe your event in your own words. Get a budget split to the rupee, a dated timeline, a
vendor checklist with book-by dates, and ideas chosen for your style — and keep track of it all
until the day.**

🌐 **Live app:** https://utsav-982453010059.asia-south1.run.app
📦 **Repository:** https://github.com/vinamravinay12/utsav

---

## 🎯 Chosen vertical & the problem

**Vertical:** a planning assistant that helps people organise **weddings, birthdays and
community events** with **budgets, timelines, vendor checklists and personalised ideas**.

Most hosts plan once or twice in their lives. They do not know that a wedding caterer needs
booking six months out, that ₹450 a plate will not feed a wedding, that a society fair of 400
people needs police permission and a loudspeaker licence, or that an open-air event in July
needs a rain plan before it needs flowers. Generic chatbots answer with confident paragraphs
that cannot be checked, change every time, and forget everything on refresh.

Utsav gives the host a **plan they can act on and trust**:

- every number is computed by a deterministic, tested engine, not generated;
- the AI does the two things it is good at — **reading** a messy description and **writing**
  personalised ideas — and both are validated against the engine before the host sees them;
- the plan is saved in the browser and tracked over weeks: ticked tasks, booked vendors and
  actual spend, with overdue warnings and rebalancing advice.

---

## 🧭 How it works

```
 "My sister's wedding in Jaipur on 14 Feb, ~250 guests, 18 lakh, eco-friendly, Jain counter"
        │
        ▼
 ① Read  ── Gemini extracts a draft brief (schema-constrained JSON, closed vocabularies)
        │    • a separate Gemini judge screens the text for prompt injection, in parallel
        │    • the engine re-validates every field; unknown values are dropped, not guessed
        ▼
 ② Check ── the host reviews the pre-filled form and answers only what was missing
        ▼
 ③ Plan  ── the pure engine builds the plan in ~30 µs, in the browser
        │    • budget split across categories, priorities boosted, 10% reserve protected
        │    • feasibility: per-guest floors with "invite N guests or raise to ₹X" remedies
        │    • timeline: every task dated; compressed smoothly when time is short; at-risk flags
        │    • vendors: book-by dates, expected fee and advance, questions, contract checks
        │    • ideas: catalogue ideas ranked for this brief, each with plain-language reasons
        │    • insights: 13 rules (monsoon + open-air, peak wedding season, crowd size, …)
        ▼
 ④ Personalise ── "Get AI ideas": Gemini writes ideas for this city, season and style;
        │    the server rebuilds the plan and keeps only ideas that fit the real budget
        ▼
 ⑤ Track ── tick tasks, set vendor status, enter spend → readiness score, overdue alerts,
             overspend reallocation; export the timeline to any calendar (.ics) or print/PDF
```

---

## ✅ What's covered

| Capability               | What the host gets                                                                                                                                                                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Event types**          | Weddings (23 tasks, 9 vendors, 17 ideas), birthdays (18 / 7 / 16), community events (20 / 8 / 15)                                                                                      |
| **Budget**               | 9–10 categories per event, shares in basis points that always sum to the total exactly; up to 3 priorities get 30% more weight; contingency reserve never squeezed                     |
| **Feasibility**          | Per-guest floors (e.g. ₹800/plate for wedding catering) with two exact remedies: guests the money covers, or the budget that covers everyone                                           |
| **Spend tracking**       | Actual vs planned per category, near-limit and over-budget states, and concrete "move ₹X from A to B" suggestions (reserve first, priorities last)                                     |
| **Timeline**             | Every task dated against the event; six phases; tasks pulled forward without reordering when time is short; essential and at-risk flags; overdue when the host returns later           |
| **Vendors**              | Book-by date, budgeted fee, typical advance, 2–4 questions to ask and 2–3 things to get in the contract, per vendor; status tracking                                                   |
| **Ideas**                | Catalogue ideas filtered by setting, audience and affordability, ranked by style and interests, capped per category, each with reasons; plus Gemini ideas validated against the budget |
| **Context rules**        | Indian seasons (monsoon rain plans, summer heat), peak wedding months, festival demand, crowd safety, children's supervision, elders' access, dietary labelling, low-waste             |
| **Conditional planning** | Tasks and vendors appear only when they apply — tenting for open-air, permits for large or outdoor community events, supervision for children's parties                                |
| **Artifacts**            | Calendar export (.ics, RFC 5545) of pending tasks; printable plan (all sections)                                                                                                       |
| **Persistence**          | The plan and all progress survive refresh and return visits (versioned, validated local storage); editing the brief keeps progress                                                     |

---

## 🤖 How AI is used (Google Gemini)

Utsav uses **Gemini (`gemini-3.1-flash-lite`, falling back to `gemini-flash-lite-latest`)** through
the official `@google/genai` SDK, **server-side only**. There are three distinct calls:

| Call                   | Where                                                                                              | What Gemini does                                                                                                                                                                                       | How its output is constrained                                                                                                                                                                                                                           |
| :--------------------- | :------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Brief extraction**   | `POST /api/extract` → [`extract-brief.ts`](packages/server/src/extract/extract-brief.ts)           | Reads a free-text description into fields: event type, date (resolving "next February 14"), guests, budget ("18 lakh" → 1800000), city, setting, style, audience, priorities, interests, dietary needs | `responseJsonSchema` generated from the Zod schema with **enum-only vocabularies**; temperature 0; output re-parsed with Zod, then normalised by the engine's own validator, which drops anything out of range                                          |
| **Injection judge**    | Same request, run **in parallel** → [`screen-input.ts`](packages/server/src/guard/screen-input.ts) | An independent classifier labels the text `safe` or `manipulation`                                                                                                                                     | Separate system instruction, its own schema, no task to be talked out of; a pattern pre-screen blocks blatant attempts with **no model call at all**                                                                                                    |
| **Personalised ideas** | `POST /api/ideas` → [`generate-ideas.ts`](packages/server/src/ideas/generate-ideas.ts)             | Writes up to four ideas specific to the city, season, style, audience, interests and dietary needs, each tied to a budget category with a cost                                                         | The server **rebuilds the plan itself** from the validated brief; the category must be one of the plan's (enum in the schema); cost must be ≤ 60% of that category; no links, phone numbers or instruction-like text; no repeats of ideas already shown |

**What the AI never does:** set a budget, a date, a vendor, a deadline or a risk. Those come
from the engine and its reviewed catalogue, so the same brief always produces the same plan.

---

## 🏗️ Architecture & stack

```
packages/
├── core/     Pure TypeScript planning engine. No I/O, no clock, no network.
│   ├── catalog/     declarative planning knowledge: 3 event templates, vocabularies,
│   │                seasons, 13 insight rules — data, not code
│   ├── budget/      allocation (largest-remainder), feasibility, spend tracking
│   ├── timeline/    order-preserving compression, phases, progress
│   ├── vendors/ ideas/ insights/ brief/ plan/ export/ (iCalendar)
├── server/   Express 5 API: the trust boundary. Holds the Gemini key, guards and
│             validates every model call, serves the built client.
└── client/   React 19 + Vite + Tailwind 4. Builds the plan locally with core;
              calls the server only for the two AI features.
```

The client and server share **one** engine, so the form, the server and the plan can never
disagree about what a valid brief is. Full details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
and the decisions behind it in [docs/decisions.md](docs/decisions.md).

**Stack:** TypeScript 6 (strict) · React 19 · Vite 8 · Tailwind CSS 4 · Express 5 · Zod 4 ·
`@google/genai` · Vitest 5 · Testing Library · axe-core · Google Cloud Run.

---

## 🚀 Run locally

Requires Node 22+.

```bash
npm install
cp packages/server/.env.example packages/server/.env   # add GEMINI_API_KEY (optional locally)
npm run dev:server    # API on :8099 (offline keyword reader if no key)
npm run dev:client    # app on :5173, proxies /api to the server
```

```bash
npm run verify        # format, lint, typecheck, 289 tests at 100% coverage, build
npm run profile       # engine and server latency, memory and payload measurements
```

**Deploy (Cloud Run, one container for API + client):**

```bash
gcloud run deploy utsav --source . --region asia-south1 --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

---

## 📚 Documentation

| Document                                  | What it covers                                                          |
| :---------------------------------------- | :---------------------------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)   | Packages, data flow, the engine's algorithms, request lifecycle         |
| [decisions.md](docs/decisions.md)         | Architecture decision records, including what each choice cost          |
| [AI.md](docs/AI.md)                       | Every Gemini call: prompts, schemas, validation, failure handling       |
| [SECURITY.md](docs/SECURITY.md)           | Threat model, prompt-injection defence, headers, rate limiting, secrets |
| [EFFICIENCY.md](docs/EFFICIENCY.md)       | Profiling results, Lighthouse, bundle and payload sizes, caching        |
| [TESTING.md](docs/TESTING.md)             | Test strategy, invariant tests over the catalogue, coverage gates       |
| [ACCESSIBILITY.md](docs/ACCESSIBILITY.md) | WCAG approach, keyboard patterns, automated axe checks                  |
| [CODE_QUALITY.md](docs/CODE_QUALITY.md)   | Enforced quality gates and conventions                                  |

---

## 🔒 Security

Full details in [docs/SECURITY.md](docs/SECURITY.md). Highlights:

- The Gemini key lives only in the server (Secret Manager in production); CI fails if a
  key-shaped string reaches the client bundle; the server refuses to start in production without it.
- **Two-layer prompt-injection defence:** pattern pre-screen (blocks with no model call) plus an
  independent **LLM judge** run in parallel; untrusted text is always fenced; outputs are
  schema-constrained to closed vocabularies and re-validated.
- Rate limiting keyed on the **proxy-resolved client IP** (`trust proxy` = 1 hop): a forged
  `X-Forwarded-For` cannot buy a fresh quota — covered by an HTTP test.
- Zod at every boundary, a 16 KB body cap, sanitised errors, strict CSP
  (`script-src 'self'`, no inline script), HSTS, COOP/CORP, `X-Frame-Options: DENY`.
- Model ideas carrying links, phone numbers or instruction-like text are dropped.
- Restored local storage is treated as untrusted and re-validated by the engine.

## ♿ Accessibility

Full details in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md). Highlights:

- **Lighthouse Accessibility 100** (mobile and desktop); **zero axe violations** asserted in tests at
  every stage of the journey and on every dashboard tab.
- Native controls throughout (radios, checkboxes, selects, `<progress>`, `<details>`); WAI-ARIA tabs
  with arrow/Home/End keys; skip link; focus moves to the new content on each stage change.
- Every error is linked to its field with `aria-describedby` and `aria-invalid`; alerts use `role="alert"`.
- Light, dark and system themes from CSS tokens chosen for WCAG AA contrast; reduced-motion respected.

## ⚡ Efficiency

Full details in [docs/EFFICIENCY.md](docs/EFFICIENCY.md). Highlights (measured with `npm run profile`):

- **Plan build: 31 µs p50 / 42 µs p95** for a full wedding plan; ~30 000 plans/sec; heap change
  after 50 000 plans: **0.09 MB**. Plans are built in the browser — **zero network calls**.
- Profiling found calendar folding was quadratic; fixed: **413 µs → 58 µs** (7×).
- **Lighthouse Performance 100**: mobile LCP 1.5 s, TBT 0 ms, CLS 0.
- Dashboard code-split (10 KB gz) from the start screen; gzip on; fingerprinted assets cached immutably.
- Repeated AI requests are served from a bounded TTL cache with **no model call**; the injection
  judge runs in parallel, adding no latency; blatant injections cost no model call at all.

## 🧪 Verification & testing

Full details in [docs/TESTING.md](docs/TESTING.md). Highlights:

- **289 tests**, **100% statements, branches, functions and lines**, enforced in
  [`vitest.config.ts`](vitest.config.ts) with `all: true`.
- Invariant tests over the catalogue (shares sum to 10 000 bp, vendor shares ≤ 100% per category,
  every condition field exists, every idea uses the shared vocabulary).
- Property check: allocation sums exactly to the total across 500 random cases.
- Supertest HTTP tests for every route, status code, header policy and the forged-header rate-limit case.
- Full-journey UI tests with axe assertions at every step.
- CI: verify gate, profiling, `npm audit`, gitleaks, a bundle-secret check, CodeQL and a container build.

---

## 📝 Assumptions

- Money is whole Indian rupees and benchmarks (per-plate floors, budget tiers) reflect typical
  Indian costs in 2026; seasons follow the Indian calendar (monsoon June–September, festive
  October–November, peak weddings November–February).
- Budget shares, lead times and per-guest floors are planning heuristics from common practice, not
  quotes; the app says so wherever it shows money.
- One active plan per browser; plans are kept on the device rather than in an account, so
  nothing personal is stored on a server.
- The browser's date is trusted within ±1 day of the server's (covers every time zone).
- Hosts describe events in English (Gemini tolerates Hinglish and informal text well).

## 🧩 Known gaps

- Plans live in one browser; there is no account or cross-device sync yet (the .ics export and
  print view are the ways to share a plan today).
- Costs are not localised by city tier; a Jaipur and a Mumbai wedding share benchmarks.
- The rate limiter is per instance, which bounds abuse of the model quota but is not a global counter.

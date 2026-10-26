# Efficiency

Everything here is measured. Reproduce the engine and server numbers with `npm run profile`
([`profile-engine.mjs`](../scripts/profile-engine.mjs) and [`profile-server.mjs`](../scripts/profile-server.mjs)); CI runs it on every push.

## Where the work happens

| Work                                                           | Where                  | Network                                   |
| :------------------------------------------------------------- | :--------------------- | :---------------------------------------- |
| Building the plan (budget, timeline, vendors, ideas, insights) | Browser, `@utsav/core` | none                                      |
| Progress, overdue checks, spend rebalancing, calendar export   | Browser                | none                                      |
| Reading a description                                          | Server → Gemini        | one request (two model calls in parallel) |
| Personalised ideas                                             | Server → Gemini        | one request, on demand only               |

The core experience after a brief is confirmed — every tab, tick, status change and spend entry —
makes **no network calls at all**.

## Profiling: Engine latency (10 000 runs each)

| Brief            |     p50 |     p95 |     p99 | plans/sec |
| :--------------- | ------: | ------: | ------: | --------: |
| wedding          | 30.8 µs | 49.4 µs | 80.2 µs |    30,130 |
| birthday         | 23.4 µs | 26.5 µs | 49.0 µs |    41,915 |
| community        | 25.7 µs | 28.6 µs | 51.4 µs |    37,999 |
| spending summary |  0.8 µs |  1.2 µs |  1.6 µs | 10,40,248 |
| calendar export  | 56.6 µs | 67.7 µs | 91.5 µs |    17,315 |

## Profiling: Memory

Heap change after 50 000 plans: 0.09 MB

## Profiling: Payloads

| Item                                                    |    Size |
| :------------------------------------------------------ | ------: |
| Full wedding plan as JSON (never sent over the network) | 14.0 KB |
| Saved progress in localStorage (brief + ticks)          |  0.5 KB |
| Calendar export (.ics)                                  |  6.2 KB |

## Profiling: Server latency over loopback (500 sequential requests, offline model client)

| Request                                              |     p50 |     p95 |
| :--------------------------------------------------- | ------: | ------: |
| GET /api/health                                      | 0.15 ms | 0.34 ms |
| POST /api/extract (cache hit after first)            | 0.16 ms | 0.33 ms |
| POST /api/extract (rejected by validation)           | 0.13 ms | 0.21 ms |
| POST /api/extract (blocked injection, no model call) | 0.12 ms | 0.16 ms |

Node v24.3.0 on darwin/arm64

The server numbers isolate our own code (offline model client): validation, screening, caching,
compression and headers add about **0.15 ms** per request.

### A finding from profiling

The first profile showed the calendar export at **413 µs p50** — out of line with everything else.
`foldLine` re-measured the whole growing line for every character (quadratic). It now returns
short lines untouched and counts bytes incrementally: **56.6 µs p50, 7.3× faster**, with the same
tests passing.

## Model latency (Gemini, measured)

| Call                     | Gemini 3.6 Flash (primary) | Flash-Lite (fallback) | Notes                            |
| :----------------------- | -------------------------: | --------------------: | :------------------------------- |
| Injection judge          |                  1.6–2.7 s |             1.0–1.6 s | runs in parallel with extraction |
| Brief extraction         |                 2.5–16.8 s |             1.7–2.1 s | Flash latency varies with load   |
| Personalised ideas       |                    30–46 s |                ~2.6 s | only when the host asks          |
| Repeat of either request |                     < 1 ms |                < 1 ms | served from the TTL cache        |
| Blatant injection        |               0.07 ms live |                     — | pattern screen, no model call    |

Every call runs with `thinkingLevel: MINIMAL` (default thinking on 3.6 Flash took 6.4 s and
still truncated the answer) and per-purpose `maxOutputTokens` (120 / 600 / 1200). Each model gets
a **10 s abort**; beyond that, or on a 5xx or rate limit, the next model answers. The worst case for
a host is therefore about 10 s plus a Flash-Lite answer, not an unbounded wait. Extraction latency is
the slower of the two parallel calls, not their sum.

## Lighthouse

Measured against the **live Cloud Run deployment** (https://utsav-982453010059.asia-south1.run.app)
and the same build served locally; both scored identically.

|                                            | Performance | Accessibility | Best practices |   SEO   |
| :----------------------------------------- | :---------: | :-----------: | :------------: | :-----: |
| Mobile (simulated slow 4G, mid-tier phone) |   **100**   |    **100**    |    **100**     | **100** |
| Desktop                                    |   **100**   |    **100**    |    **100**     | **100** |

| Metric (live)            | Mobile | Desktop |
| :----------------------- | -----: | ------: |
| First Contentful Paint   |  1.4 s |   0.4 s |
| Largest Contentful Paint |  1.4 s |   0.4 s |
| Total Blocking Time      |   0 ms |    0 ms |
| Cumulative Layout Shift  |      0 |       0 |
| Speed Index              |  1.5 s |   0.4 s |

Lighthouse 12.8.2, headless Chrome.

## Bundle

| Asset                                                | Minified | Gzip -9 |
| :--------------------------------------------------- | -------: | ------: |
| `index.js` (React, start screen, form, engine)       |   274 KB | 84.6 KB |
| `PlanDashboard.js` (lazy, loaded once a plan exists) |  29.6 KB |  9.9 KB |
| `index.css` (Tailwind, purged)                       |  22.8 KB |  5.0 KB |

- The dashboard is a separate chunk loaded with `React.lazy` only when there is a plan.
- No web fonts (system font stack), no images beyond a 0.4 KB SVG icon, no runtime CSS-in-JS.
- `compression` gzips every response; fingerprinted `/assets/*` are served with
  `Cache-Control: public, max-age=31536000, immutable`; `index.html` with `no-cache`, so deploys
  are picked up immediately while repeat visits download nothing.

## Rendering

- `buildPlan` runs inside `useMemo` keyed on the brief and planning date, so ticking a task does not
  rebuild the plan; `summarizeSpending` is memoised on the spend record.
- Spend inputs commit on blur, and only when the value changed, so typing does not write storage
  on every keystroke.
- Saved state is about 0.5 KB; the computed plan (14 KB) is never stored or sent.

## Server resources

- Body limit 16 KB; caches bounded at 500 entries each with a 15-minute TTL and LRU eviction.
- Rate-limit table bounded at 10 000 clients with expired-first eviction.
- Single small container (production dependencies only), graceful `SIGTERM` shutdown for Cloud Run.

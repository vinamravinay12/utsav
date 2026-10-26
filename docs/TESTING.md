# Testing

`npm run verify` is the single gate: Prettier check → ESLint (zero warnings) → `tsc -b` →
Vitest with coverage → production build. CI runs it on every push.

## Numbers

| Package   | Test files |   Tests | Kind                                         |
| :-------- | ---------: | ------: | :------------------------------------------- |
| core      |         18 |     140 | unit, invariant, property, scenario          |
| server    |         17 |      84 | unit, adapter (fake SDK), HTTP (Supertest)   |
| client    |         14 |      65 | unit, hook, component, full-journey with axe |
| **Total** |     **49** | **289** |                                              |

Coverage: **100% statements, branches, functions and lines**, enforced by thresholds in
[`vitest.config.ts`](../vitest.config.ts) with `all: true`, so an untested file counts against the
total rather than being silently absent. Only the two process entry points (`server/index.ts`,
`client/main.tsx`) are excluded; everything they wire up is tested directly.

## The engine without mocks

`@utsav/core` has no I/O and takes the date as a parameter, so its tests are plain inputs and
outputs — no mocks, no fake timers. Three sample briefs (a winter wedding, a four-day-away
children's party on ₹15,000, a monsoon community fair for 400) are run through every module and
through `buildPlan` end to end.

## Invariant tests over the catalogue

[`registry.test.ts`](../packages/core/src/catalog/registry.test.ts) checks every template:

- budget shares sum to exactly 10 000 basis points, all positive, exactly one reserve;
- every task, vendor and idea references a real budget category;
- `latestDaysBefore ≤ idealDaysBefore ≤ idealLeadDays`; after-event tasks are consistently negative;
- each template has an event-day task and a follow-up;
- vendor shares within a category never exceed 100%;
- every condition field and insight placeholder exists in the planning context;
- every idea uses the shared vocabulary, and each style has at least one low-cost idea;
- ids are unique across the whole catalogue.

## Property and edge checks

- `allocateByWeight` sums exactly to the total and never goes negative across 500 generated cases.
- `compressOffset` is monotonic and bounded for every ideal offset 0–300.
- Every template schedules with no compression given its full runway.
- iCalendar folding never exceeds 75 octets and never splits a multi-byte character.

## Server

- The Gemini adapter is tested against an injected `generateContent`, and the SDK binding against a
  mocked `@google/genai` module — no network in tests.
- HTTP tests cover every route and status: 200, 400 (schema, JSON parse), 404, 413, 422 (pattern
  and judge), 429 (quota and rate limit), 503, 500 with a sanitised body; security headers on API
  and app responses; CORS only when configured; static caching; HEAD; relative `STATIC_DIR`.
- The rate-limit test forges a different `X-Forwarded-For` on each request from one client and
  asserts the limit still applies.

## Client

- `App.test.tsx` drives the real app: describe → review (missing-field errors linked to inputs) →
  plan → every tab → tick a task, book a vendor, overspend and see the reallocation, fetch AI ideas →
  check what was persisted; plus edit-keeps-progress, confirmed reset, calendar export and print.
- `expectNoViolations` (axe) runs at each stage and on each tab.
- The WAI-ARIA tabs keyboard pattern (arrows, Home, End, wrap-around) has its own test.
- Restored storage is tested against wrong versions, wrong shapes and individually corrupt values.

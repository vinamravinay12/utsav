# How Utsav uses Gemini

|                |                                                                                                                                                                                                                                                                                                |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Models**     | `gemini-3.6-flash` first, then `gemini-3.1-flash-lite` and `gemini-flash-lite-latest` (configurable with `GEMINI_MODEL` / `GEMINI_MODELS`)                                                                                                                                                     |
| **SDK**        | `@google/genai`, called only from the server ([`gemini-client.ts`](../packages/server/src/llm/gemini-client.ts))                                                                                                                                                                               |
| **Every call** | `responseMimeType: application/json`, `responseJsonSchema`, system instruction, `thinkingLevel: MINIMAL`, per-purpose `maxOutputTokens` (guard 120, extract 600, ideas 1200), 10 s abort per model, 2 attempts with backoff on 5xx, next model on any failure, 429 reported as quota exhausted |

## 1. Brief extraction — reading the host's words

_Prompt:_ [`build-extraction-prompt.ts`](../packages/server/src/prompts/build-extraction-prompt.ts) ·
_Flow:_ [`extract-brief.ts`](../packages/server/src/extract/extract-brief.ts)

- The system instruction limits the model to **stated or clearly implied facts**, defines how to
  map event kinds to the three types, resolve relative dates against today, convert lakh/crore/k
  to rupees, and choose priorities only from that event type's category ids.
- The user turn carries today's date, the category ids per event type, and the description
  **fenced** between `<<<UNTRUSTED_HOST_TEXT>>>` markers (markers inside the text are stripped
  first so it cannot close the fence).
- Temperature 0. Schema enums for event type, setting, style, audience, interests and dietary.
- The result is Zod-parsed, then `normalizeDraft` (core) drops anything out of range and keeps
  only priorities valid for the event type. `findMissingFields` turns gaps into questions.

Measured on the three sample prompts: all fields extracted correctly, including "a Sunday about
10 weeks from now" → the correct Sunday and "1.5 lakh" → 150000. Gemini 3.6 Flash also
read "Photos matter most" as the `photography` priority, which Flash-Lite missed.

## 2. Injection judge — an independent classifier

_Prompt:_ [`build-guard-prompt.ts`](../packages/server/src/prompts/build-guard-prompt.ts) ·
_Flow:_ [`screen-input.ts`](../packages/server/src/guard/screen-input.ts)

- Runs **in parallel** with extraction, so it adds no latency.
- Labels fenced text `safe` or `manipulation`; off-topic text is `safe` (harmless: the extractor
  finds nothing and the host fills in the form).
- Preceded by a pattern screen that blocks blatant attempts (overrides, role reassignment,
  system-prompt probes, fake role markup) **without calling the model**.
- In testing it caught a paraphrased probe the patterns do not match.

## 3. Personalised ideas — writing, held to the budget

_Prompt:_ [`build-ideas-prompt.ts`](../packages/server/src/prompts/build-ideas-prompt.ts) ·
_Flow:_ [`generate-ideas.ts`](../packages/server/src/ideas/generate-ideas.ts)

- The server rebuilds the plan from the validated brief, then sends event type, guests, days to go,
  month and season, setting, style, audience, interests, dietary needs, each funded category with
  its amount, and the titles already shown. Name and city are fenced.
- Temperature 0.7 for variety; the schema's `categoryId` is an enum of **this plan's** categories.
- Every idea is validated on its own: real category, cost ≤ 60% of it, no links/emails/phone
  numbers, no instruction-like text, not a duplicate; text is cleaned of control characters.
- The UI shows each idea's cost and its share of the category, labelled "AI suggestion".

## Why Gemini 3.6 Flash, and how it is kept fast

- **Quality.** On the same prompts it extracted priorities Flash-Lite missed and wrote more specific,
  better-costed ideas (12–24% of their category, against Flash-Lite's tendency to sit at the cap).
- **Thinking is set to minimal.** With default thinking, 3.6 Flash spent the whole output budget
  on reasoning tokens and returned truncated JSON (`finishReason: MAX_TOKENS`). These calls are
  constrained reading and writing tasks with fixed schemas; they do not need extended reasoning.
- **Fallback is part of the design.** Its free tier allows 5 requests a minute per project, and its
  latency varied from 2.5 s to over 40 s under load in testing. Each model gets 10 s; a slow, failed
  or rate-limited answer hands over to Flash-Lite, so the host gets an answer rather than an error.

## Failure handling

| Situation             | Behaviour                                                                        |
| :-------------------- | :------------------------------------------------------------------------------- |
| 5xx / high demand     | retry with backoff, then the next model                                          |
| Quota exhausted (429) | 429 to the browser: "reached its daily limit — you can still fill in the form"   |
| Unavailable           | 503: "busy right now — try again, or fill in the form"                           |
| Off-schema answer     | extraction: empty draft (host fills the form); ideas: none shown, with a message |
| Judge unavailable     | proceeds on the pattern screen (see ADR-3)                                       |
| No API key            | development uses an offline keyword reader; **production refuses to start**      |

## Cost control

- Bounded TTL caches (500 entries, 15 minutes) keyed by SHA-256: a repeated description or idea
  request costs nothing.
- Blatant injections and invalid requests never reach the model.
- 10 AI requests per minute per client, keyed on the proxy-resolved IP.

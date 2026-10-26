# Security

## Threat model

| Asset              | Threat                                                 | Control                                                                                                                           |
| :----------------- | :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Gemini API key     | Exposure in the browser or repository                  | Server-only; Secret Manager in production; `.env` gitignored; CI greps the built bundle for key shapes; gitleaks on every push    |
| Model behaviour    | Prompt injection via the description, name or city     | Pattern screen + independent LLM judge; fencing; closed-vocabulary schemas; engine re-validation; host reviews every field        |
| What the host sees | Model output with links, phone numbers or instructions | Ideas containing any of these are dropped; React escapes all text; control characters and angle brackets are stripped             |
| Model quota        | One client exhausting the shared quota                 | 10 req/min per proxy-resolved IP; cache; no model call for invalid or blatant requests                                            |
| Server             | Oversized or malformed input                           | 16 KB body cap; Zod on every request; JSON parse errors → 400; unknown errors → generic 500 with details only in logs             |
| Browser            | XSS, clickjacking, data leakage                        | Strict CSP (no inline script), `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, COOP/CORP, HSTS |
| Host data          | Tampered or corrupted local storage                    | Versioned schema; brief re-validated by the engine; bad fields dropped individually                                               |

## Prompt-injection defence in depth

1. **Pattern screen** — [`detect-injection.ts`](../packages/server/src/guard/detect-injection.ts).
   Anchored to prompt vocabulary (instructions, system prompt, role markup) so ordinary event text
   such as "ignore the rain forecast" or "you must book early" passes. Blocks with no model call.
2. **LLM judge** — [`screen-input.ts`](../packages/server/src/guard/screen-input.ts). A separate
   Gemini classifier with its own instruction and schema, run in parallel with extraction.
3. **Fencing** — [`fence-untrusted.ts`](../packages/server/src/prompts/fence-untrusted.ts). Untrusted
   text sits between markers the system instruction declares as data; embedded markers are stripped.
4. **Constrained output** — enums at decode time; Zod and `normalizeDraft` after. The worst a
   successful injection can do is pick a wrong value from a closed list, which the host sees.
5. **Output checks** — AI ideas are validated against the server-built plan and scanned for links,
   contact details and instruction-like text.

## Rate limiting

[`rate-limit.ts`](../packages/server/src/security/rate-limit.ts) keys on `request.ip`, which
Express derives with `trust proxy` = `TRUST_PROXY_HOPS` (1 on Cloud Run). That is the address
Google's front end appended — the right-most `X-Forwarded-For` entry — which a client cannot forge.
`app.test.ts` sends three requests with different forged left-most addresses from one client and
asserts the third is rejected with `Retry-After`. Memory is bounded: expired windows are swept
first, then the oldest is evicted, so a flood of addresses cannot reset everyone's counts.

## Headers

The API sends `default-src 'none'`. The app shell sends:

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self';
connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self';
frame-ancestors 'none'; upgrade-insecure-requests
```

The client needs no inline script: the theme follows `prefers-color-scheme` in CSS before
JavaScript runs. CORS is off by default because the client is same-origin.

## Secrets and supply chain

- `GEMINI_API_KEY` from Secret Manager (`--set-secrets`); never logged — health reports only the mode.
- CI: `npm audit --audit-level=high`, gitleaks, CodeQL (`security-extended`), bundle-secret check.
- `npm audit` gates every push; dependency updates are applied deliberately on `main` rather
  than by an update bot, so the repository keeps a single branch. Runtime dependencies are minimal
  (express, zod, compression, @google/genai).
- Container runs as the unprivileged `node` user with production dependencies only.

## Privacy

No accounts and no server-side storage of plans. Descriptions are sent to Gemini to be read; the
extracted draft (not the description) is cached in memory for 15 minutes under a SHA-256 key.
Logs record model, purpose and timing, never the host's text. The footer tells hosts this.

## Reporting

See [`/.well-known/security.txt`](../packages/client/public/.well-known/security.txt).

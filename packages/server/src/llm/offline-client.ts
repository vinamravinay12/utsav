import { extractFenced } from '../prompts/fence-untrusted.js';
import type { LlmClient, LlmRequest } from './llm-client.js';

const EVENT_WORDS: readonly (readonly [string, RegExp])[] = [
  ['wedding', /\b(wedding|marriage|shaadi|reception|engagement)\b/i],
  ['birthday', /\b(birthday|bday)\b/i],
  ['community', /\b(community|festival|fair|fundraiser|drive|society|association|club)\b/i],
];

const LAKH = 100_000;

/** "18 lakh", "1.5 lakh", "₹80,000", "80k" → rupees. */
export function readBudget(text: string): number | null {
  const lakh = /(\d+(?:\.\d+)?)\s*(lakh|lac)/i.exec(text);
  if (lakh !== null) {
    return Math.round(Number(lakh[1]) * LAKH);
  }
  const thousands = /(\d+)\s*k\b/i.exec(text);
  if (thousands !== null) {
    return Number(thousands[1]) * 1000;
  }
  const rupees = /₹\s*([\d,]+)/.exec(text);
  return rupees === null ? null : Number(rupees[0].replace(/[₹,\s]/g, ''));
}

function readDescription(text: string): Record<string, unknown> {
  const guests = /(\d+)\s*(guests|people|attendees|family and friends)/i.exec(text);
  return {
    eventType: EVENT_WORDS.find(([, pattern]) => pattern.test(text))?.[0] ?? null,
    name: null,
    eventDate: null,
    guestCount: guests === null ? null : Number(guests[1]),
    totalBudget: readBudget(text),
    city: null,
    setting: /\boutdoor|park|garden|lawn\b/i.test(text) ? 'outdoor' : null,
    style: /\beco|zero[- ]waste|sustainab/i.test(text) ? 'eco' : null,
    ageGroup: null,
    priorities: [],
    interests: [],
    dietary: [],
  };
}

/**
 * A deterministic, keyword-based reader used when no API key is configured —
 * in tests and in local development. Production refuses to start without a key
 * (see config.ts), so this never answers a real user.
 */
export function createOfflineClient(): LlmClient {
  return {
    generate(request: LlmRequest): Promise<string> {
      const text = extractFenced(request.prompt);
      const responses = {
        guard: { verdict: 'safe', reason: 'Offline mode: heuristic screening only.' },
        extract: readDescription(text),
        ideas: { ideas: [] },
      };
      return Promise.resolve(JSON.stringify(responses[request.purpose]));
    },
  };
}

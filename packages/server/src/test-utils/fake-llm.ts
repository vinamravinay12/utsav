import type { LlmClient, LlmPurpose, LlmRequest } from '../llm/llm-client.js';

type Responder = string | Error | ((request: LlmRequest) => string);

/**
 * A scripted model: each purpose answers with a fixed string, a thrown error,
 * or a function of the request. Every request is recorded for assertions.
 */
export function fakeLlm(responses: Partial<Record<LlmPurpose, Responder>>): LlmClient & {
  readonly requests: LlmRequest[];
} {
  const requests: LlmRequest[] = [];
  return {
    requests,
    generate(request) {
      requests.push(request);
      const responder = responses[request.purpose];
      if (responder === undefined) {
        return Promise.reject(new Error(`No scripted response for ${request.purpose}`));
      }
      if (responder instanceof Error) {
        return Promise.reject(responder);
      }
      return Promise.resolve(typeof responder === 'function' ? responder(request) : responder);
    },
  };
}

export const SAFE_VERDICT = JSON.stringify({ verdict: 'safe', reason: 'Describes an event.' });

export const WEDDING_EXTRACTION = JSON.stringify({
  eventType: 'wedding',
  name: 'Asha & Rohan',
  eventDate: '2027-02-14',
  guestCount: 250,
  totalBudget: 1_800_000,
  city: 'Jaipur',
  setting: null,
  style: 'eco',
  ageGroup: null,
  priorities: ['photography', 'cake'],
  interests: ['sustainability'],
  dietary: ['jain'],
});

export const COMPLETE_BRIEF = {
  eventType: 'wedding',
  name: 'Asha & Rohan',
  eventDate: '2027-02-14',
  guestCount: 250,
  totalBudget: 1_800_000,
  city: 'Jaipur',
  setting: 'mixed',
  style: 'eco',
  ageGroup: 'all-ages',
  priorities: ['photography'],
  interests: ['sustainability'],
  dietary: ['jain'],
} as const;

export const TODAY = '2026-10-26';
export const NOW = (): Date => new Date('2026-10-26T06:00:00Z');

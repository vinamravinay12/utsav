import type { EventBrief } from '@utsav/core';
import type { AiIdea } from '../api/types.js';
import { STORAGE_KEY, STORAGE_VERSION, type SavedPlan } from '../state/saved-plan.js';

export const TODAY = '2026-10-26';

export const brief: EventBrief = {
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
};

export const aiIdea: AiIdea = {
  title: 'Block-print drapes',
  description: 'Reusable hand-printed cotton from Sanganer.',
  categoryId: 'decor',
  categoryLabel: 'Décor & flowers',
  estimatedCost: 40_000,
  shareOfCategory: 19,
};

export const savedPlan = (overrides: Partial<SavedPlan> = {}): SavedPlan => ({
  version: STORAGE_VERSION,
  brief,
  plannedOn: TODAY,
  done: [],
  vendorStatus: {},
  spent: {},
  aiIdeas: [],
  ...overrides,
});

export const storePlan = (plan: SavedPlan): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
};

/** A fetch stub answering by path. Unknown paths reject like a network failure. */
export function stubFetch(routes: Readonly<Record<string, { status?: number; body: unknown }>>) {
  return (input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    const path =
      typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    const route = routes[path];
    if (route === undefined) {
      return Promise.reject(new TypeError('Failed to fetch'));
    }
    return Promise.resolve(
      new Response(JSON.stringify(route.body), {
        status: route.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

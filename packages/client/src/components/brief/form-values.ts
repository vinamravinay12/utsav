import { EVENT_TYPE_IDS, findTemplate, isMember } from '@utsav/core';

/** Form state as the inputs hold it: strings for text and numbers, arrays for chips. */
export interface FormValues {
  readonly eventType: string;
  readonly name: string;
  readonly eventDate: string;
  readonly guestCount: string;
  readonly totalBudget: string;
  readonly city: string;
  readonly setting: string;
  readonly style: string;
  readonly ageGroup: string;
  readonly priorities: readonly string[];
  readonly interests: readonly string[];
  readonly dietary: readonly string[];
}

type Draft = Readonly<Record<string, unknown>>;

const text = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

export function toFormValues(draft: Draft): FormValues {
  return {
    eventType: text(draft.eventType),
    name: text(draft.name),
    eventDate: text(draft.eventDate),
    guestCount: text(draft.guestCount),
    totalBudget: text(draft.totalBudget),
    city: text(draft.city),
    setting: text(draft.setting),
    style: text(draft.style),
    ageGroup: text(draft.ageGroup),
    priorities: list(draft.priorities),
    interests: list(draft.interests),
    dietary: list(draft.dietary),
  };
}

/** Whole numbers only; "18,00,000" and "1 500" are read as the host meant them. */
export function parseWholeNumber(value: string): number | undefined {
  const digits = value.replace(/[\s,₹]/g, '');
  return /^\d+$/.test(digits) ? Number(digits) : undefined;
}

/** Back to a draft for the engine's validator. Empty fields are left out, not sent as "". */
export function toDraft(values: FormValues): Draft {
  const entries = Object.entries({
    ...values,
    guestCount: parseWholeNumber(values.guestCount),
    totalBudget: parseWholeNumber(values.totalBudget),
  });
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined && value !== ''));
}

/** Budget categories the host may prioritise for the chosen event type. */
export function priorityOptions(eventType: string): (readonly [string, string])[] {
  if (!isMember(EVENT_TYPE_IDS, eventType)) {
    return [];
  }
  return findTemplate(eventType)
    .budget.filter((category) => category.isContingency !== true)
    .map((category) => [category.id, category.label] as const);
}

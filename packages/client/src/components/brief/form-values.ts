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

/** Form inputs hold strings; numbers are shown as typed digits, anything else as empty. */
const asInputText = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

/** Keeps only the string entries of an untrusted list. */
const asStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

/** Turns a draft (from the AI or a saved brief) into the strings and lists the inputs hold. */
export function toFormValues(draft: Draft): FormValues {
  return {
    eventType: asInputText(draft.eventType),
    name: asInputText(draft.name),
    eventDate: asInputText(draft.eventDate),
    guestCount: asInputText(draft.guestCount),
    totalBudget: asInputText(draft.totalBudget),
    city: asInputText(draft.city),
    setting: asInputText(draft.setting),
    style: asInputText(draft.style),
    ageGroup: asInputText(draft.ageGroup),
    priorities: asStringList(draft.priorities),
    interests: asStringList(draft.interests),
    dietary: asStringList(draft.dietary),
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

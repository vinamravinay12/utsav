import { EVENT_TYPES, labelOf } from '../catalog/vocabulary.js';
import { daysBetween } from '../dates/iso-date.js';
import type { BriefDraft, EventBrief } from '../types/index.js';
import { BRIEF_LIMITS, REQUIRED_FIELDS, type RequiredField } from './limits.js';
import { normalizeDraft, type NormalizedDraft } from './normalize-draft.js';

export interface BriefIssue {
  readonly field: RequiredField;
  readonly message: string;
}

export type BriefResult =
  | { readonly ok: true; readonly brief: EventBrief }
  | { readonly ok: false; readonly issues: readonly BriefIssue[] };

const QUESTIONS: Readonly<Record<RequiredField, string>> = {
  eventType: 'What kind of event is it?',
  eventDate: 'What date is the event?',
  guestCount: 'Roughly how many guests?',
  totalBudget: 'What is the total budget in rupees?',
  city: 'Which city or town is it in?',
  setting: 'Will it be indoors, outdoors or both?',
  style: 'Which style fits best?',
  ageGroup: 'Who are the guests, by age?',
};

/** The questions still to ask, in order, for a draft. */
export function findMissingFields(draft: BriefDraft): BriefIssue[] {
  return REQUIRED_FIELDS.filter((field) => draft[field] === undefined).map((field) => ({
    field,
    message: QUESTIONS[field],
  }));
}

function dateIssue(eventDate: string, today: string): BriefIssue | undefined {
  const lead = daysBetween(today, eventDate);
  if (lead < 0) {
    return { field: 'eventDate', message: 'The event date has already passed.' };
  }
  return lead > BRIEF_LIMITS.maxLeadDays
    ? { field: 'eventDate', message: 'Choose a date within the next three years.' }
    : undefined;
}

/**
 * Turns a draft into a brief the engine can plan, or says exactly what is
 * missing or wrong. The draft is re-normalised first, so this is safe to call
 * on anything — form state, AI output or a restored session.
 */
export function completeBrief(
  input: Readonly<Record<string, unknown>>,
  today: string,
): BriefResult {
  const draft = normalizeDraft(input);
  const missing = findMissingFields(draft);
  if (missing.length > 0) {
    return { ok: false, issues: missing };
  }
  // No required field is missing, so every one of them is defined.
  const required = draft as NormalizedDraft & Pick<EventBrief, RequiredField>;
  const { eventType, eventDate, city } = required;
  const issue = dateIssue(eventDate, today);
  if (issue !== undefined) {
    return { ok: false, issues: [issue] };
  }
  return {
    ok: true,
    brief: {
      eventType,
      name: draft.name ?? `${labelOf(EVENT_TYPES, eventType)} in ${city}`,
      eventDate,
      guestCount: required.guestCount,
      totalBudget: required.totalBudget,
      city,
      setting: required.setting,
      style: required.style,
      ageGroup: required.ageGroup,
      priorities: draft.priorities,
      interests: draft.interests,
      dietary: draft.dietary,
    },
  };
}

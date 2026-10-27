import { findTemplate } from '../catalog/registry.js';
import {
  AGE_GROUP_IDS,
  DIETARY_IDS,
  EVENT_TYPE_IDS,
  INTEREST_IDS,
  SETTING_IDS,
  STYLE_IDS,
  isMember,
} from '../catalog/vocabulary.js';
import { isIsoDate } from '../dates/iso-date.js';
import type { BriefDraft, EventBrief, EventTypeId } from '../types/index.js';
import { BRIEF_LIMITS } from './limits.js';

type Raw = Readonly<Record<string, unknown>>;

/** A draft whose list fields are always present, if possibly empty. */
export type NormalizedDraft = BriefDraft & Pick<EventBrief, 'priorities' | 'interests' | 'dietary'>;

/** Printable text only: control characters and angle brackets are removed. */
const UNSAFE_TEXT = /[\p{Cc}<>]/gu;

/** Printable, single-spaced, length-limited text, or undefined if nothing is left. */
export function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const cleaned = value.replace(UNSAFE_TEXT, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** The value if it is a whole number within [min, max], otherwise undefined. */
export function boundedInteger(value: unknown, min: number, max: number): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined;
}

/** Keeps only known, distinct members, up to `limit`. */
export function memberList<T extends string>(
  ids: readonly T[],
  value: unknown,
  limit: number,
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const members = value.filter((item): item is T => isMember(ids, item));
  return [...new Set(members)].slice(0, limit);
}

const categoryIdsFor = (eventType: EventTypeId | undefined): readonly string[] =>
  eventType === undefined ? [] : findTemplate(eventType).budget.map((category) => category.id);

/** The value if it belongs to the vocabulary, otherwise undefined. */
const vocabularyValue = <T extends string>(ids: readonly T[], value: unknown): T | undefined =>
  isMember(ids, value) ? value : undefined;

/**
 * Reduces untrusted input — the AI extractor's output or a restored session —
 * to a draft containing only values the engine understands.
 *
 * Nothing is coerced: an out-of-range number or an unknown style is dropped and
 * becomes a question for the host, never a guess.
 */
export function normalizeDraft(raw: Raw): NormalizedDraft {
  const eventType = vocabularyValue(EVENT_TYPE_IDS, raw.eventType);
  const draft: Record<string, unknown> = {
    eventType,
    name: cleanText(raw.name, BRIEF_LIMITS.maxNameLength),
    eventDate:
      typeof raw.eventDate === 'string' && isIsoDate(raw.eventDate) ? raw.eventDate : undefined,
    guestCount: boundedInteger(raw.guestCount, BRIEF_LIMITS.minGuests, BRIEF_LIMITS.maxGuests),
    totalBudget: boundedInteger(raw.totalBudget, BRIEF_LIMITS.minBudget, BRIEF_LIMITS.maxBudget),
    city: cleanText(raw.city, BRIEF_LIMITS.maxCityLength),
    setting: vocabularyValue(SETTING_IDS, raw.setting),
    style: vocabularyValue(STYLE_IDS, raw.style),
    ageGroup: vocabularyValue(AGE_GROUP_IDS, raw.ageGroup),
    priorities: memberList(categoryIdsFor(eventType), raw.priorities, BRIEF_LIMITS.maxPriorities),
    interests: memberList(INTEREST_IDS, raw.interests, INTEREST_IDS.length),
    dietary: memberList(DIETARY_IDS, raw.dietary, DIETARY_IDS.length),
  };
  return Object.fromEntries(
    Object.entries(draft).filter(([, value]) => value !== undefined),
  ) as NormalizedDraft;
}

import type {
  AgeGroup,
  DietaryId,
  EventTypeId,
  InterestId,
  Setting,
  StyleId,
} from '../types/index.js';

/**
 * The closed vocabularies a brief is written in.
 *
 * Every value the AI extractor returns is checked against these lists and
 * anything else is dropped, so the model can never invent a style or a dietary
 * requirement the engine does not know how to plan for.
 */
export const EVENT_TYPES: readonly (readonly [EventTypeId, string])[] = [
  ['wedding', 'Wedding'],
  ['birthday', 'Birthday'],
  ['community', 'Community event'],
];

/** Where the event happens. */
export const SETTINGS: readonly (readonly [Setting, string])[] = [
  ['indoor', 'Indoor'],
  ['outdoor', 'Outdoor'],
  ['mixed', 'Indoor and outdoor'],
];

/** The overall feel of the event. */
export const STYLES: readonly (readonly [StyleId, string])[] = [
  ['traditional', 'Traditional'],
  ['modern', 'Modern'],
  ['rustic', 'Rustic'],
  ['minimal', 'Minimal'],
  ['glamorous', 'Glamorous'],
  ['eco', 'Eco-friendly'],
];

/** Who the guests are, by age. */
export const AGE_GROUPS: readonly (readonly [AgeGroup, string])[] = [
  ['kids', 'Children'],
  ['teens', 'Teenagers'],
  ['adults', 'Adults'],
  ['seniors', 'Older guests'],
  ['all-ages', 'All ages'],
];

/** What the host or guests enjoy; used to personalise ideas. */
export const INTERESTS: readonly (readonly [InterestId, string])[] = [
  ['music', 'Music'],
  ['dance', 'Dance'],
  ['food', 'Food'],
  ['photography', 'Photography'],
  ['games', 'Games'],
  ['crafts', 'Arts and crafts'],
  ['culture', 'Culture and heritage'],
  ['sustainability', 'Sustainability'],
  ['wellness', 'Wellness'],
  ['charity', 'Giving back'],
];

/** Dietary needs the catering must meet. */
export const DIETARY: readonly (readonly [DietaryId, string])[] = [
  ['vegetarian', 'Vegetarian'],
  ['vegan', 'Vegan'],
  ['jain', 'Jain'],
  ['gluten-free', 'Gluten-free'],
  ['halal', 'Halal'],
  ['nut-free', 'Nut-free'],
];

const idsOf = <T extends string>(entries: readonly (readonly [T, string])[]): readonly T[] =>
  entries.map(([id]) => id);

/** The ids alone, for validation. */
export const EVENT_TYPE_IDS = idsOf(EVENT_TYPES);
export const SETTING_IDS = idsOf(SETTINGS);
export const STYLE_IDS = idsOf(STYLES);
export const AGE_GROUP_IDS = idsOf(AGE_GROUPS);
export const INTEREST_IDS = idsOf(INTERESTS);
export const DIETARY_IDS = idsOf(DIETARY);

/** Looks a label up by id; an unknown id falls back to itself rather than throwing. */
export function labelOf<T extends string>(
  entries: readonly (readonly [T, string])[],
  id: T,
): string {
  return entries.find(([entryId]) => entryId === id)?.[1] ?? id;
}

/** Narrows an untrusted string to a vocabulary member. */
export const isMember = <T extends string>(ids: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (ids as readonly string[]).includes(value);

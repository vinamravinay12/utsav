/** Bounds on every brief field. The form, the server schema and the engine share them. */
export const BRIEF_LIMITS = {
  minGuests: 1,
  maxGuests: 5000,
  minBudget: 1000,
  /** ₹10 crore. */
  maxBudget: 100_000_000,
  maxPriorities: 3,
  /** Plans more than three years out are not meaningfully schedulable. */
  maxLeadDays: 1095,
  maxNameLength: 80,
  maxCityLength: 60,
} as const;

/** Fields the planner asks for, in the order it asks. */
export const REQUIRED_FIELDS = [
  'eventType',
  'eventDate',
  'guestCount',
  'totalBudget',
  'city',
  'setting',
  'style',
  'ageGroup',
] as const;

export type RequiredField = (typeof REQUIRED_FIELDS)[number];

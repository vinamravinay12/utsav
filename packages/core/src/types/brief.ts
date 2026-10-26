export type EventTypeId = 'wedding' | 'birthday' | 'community';

export type Setting = 'indoor' | 'outdoor' | 'mixed';

export type AgeGroup = 'kids' | 'teens' | 'adults' | 'seniors' | 'all-ages';

export type StyleId = 'traditional' | 'modern' | 'rustic' | 'minimal' | 'glamorous' | 'eco';

export type InterestId =
  | 'music'
  | 'dance'
  | 'food'
  | 'photography'
  | 'games'
  | 'crafts'
  | 'culture'
  | 'sustainability'
  | 'wellness'
  | 'charity';

export type DietaryId = 'vegetarian' | 'vegan' | 'jain' | 'gluten-free' | 'halal' | 'nut-free';

/**
 * Everything the engine needs to plan an event.
 *
 * Money is whole Indian rupees. Dates are `YYYY-MM-DD` and carry no time zone:
 * an event happens on a calendar day, not at an instant.
 */
export interface EventBrief {
  readonly eventType: EventTypeId;
  readonly name: string;
  readonly eventDate: string;
  readonly guestCount: number;
  readonly totalBudget: number;
  readonly city: string;
  readonly setting: Setting;
  readonly style: StyleId;
  readonly ageGroup: AgeGroup;
  /** Budget category ids the host wants to spend more on. At most three. */
  readonly priorities: readonly string[];
  readonly interests: readonly InterestId[];
  readonly dietary: readonly DietaryId[];
}

/** A brief under construction — from the AI extractor, the form, or both. */
export type BriefDraft = Partial<EventBrief>;

export type BriefField = keyof EventBrief;

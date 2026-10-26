import { isPeakWeddingMonth, seasonOf } from '../catalog/seasons.js';
import { daysBetween, monthOf, weekdayOf } from '../dates/iso-date.js';
import type {
  BudgetTier,
  EventBrief,
  EventTemplate,
  LeadStatus,
  PlanningContext,
} from '../types/index.js';

export function leadStatusOf(daysUntilEvent: number, template: EventTemplate): LeadStatus {
  if (daysUntilEvent < template.minLeadDays) {
    return 'rushed';
  }
  return daysUntilEvent < template.idealLeadDays / 2 ? 'tight' : 'comfortable';
}

export function budgetTierOf(perGuest: number, template: EventTemplate): BudgetTier {
  if (perGuest >= template.tiers.premium) {
    return 'premium';
  }
  return perGuest >= template.tiers.moderate ? 'moderate' : 'lean';
}

export const perGuestOf = (brief: EventBrief): number =>
  Math.floor(brief.totalBudget / Math.max(1, brief.guestCount));

/**
 * The flat set of facts every declarative rule is evaluated against.
 *
 * Derived values (season, lead status, budget tier) are computed once here so
 * catalogue conditions and insight rules never repeat the arithmetic.
 */
export function derivePlanningContext(
  brief: EventBrief,
  template: EventTemplate,
  plannedOn: string,
): PlanningContext {
  const daysUntilEvent = daysBetween(plannedOn, brief.eventDate);
  const month = monthOf(brief.eventDate);
  const budgetPerGuest = perGuestOf(brief);
  const weekday = weekdayOf(brief.eventDate);
  return {
    eventType: brief.eventType,
    eventLabel: template.title.toLowerCase(),
    setting: brief.setting,
    style: brief.style,
    ageGroup: brief.ageGroup,
    interests: brief.interests,
    dietary: brief.dietary,
    dietaryCount: brief.dietary.length,
    guestCount: brief.guestCount,
    totalBudget: brief.totalBudget,
    budgetPerGuest,
    budgetTier: budgetTierOf(budgetPerGuest, template),
    daysUntilEvent,
    minLeadDays: template.minLeadDays,
    idealLeadDays: template.idealLeadDays,
    leadStatus: leadStatusOf(daysUntilEvent, template),
    month,
    season: seasonOf(month),
    peakWeddingSeason: isPeakWeddingMonth(month),
    weekend: weekday === 0 || weekday === 6,
  };
}

/** The context keys rules may reference; catalogue tests check against this. */
export const CONTEXT_FIELDS: readonly string[] = [
  'eventType',
  'eventLabel',
  'setting',
  'style',
  'ageGroup',
  'interests',
  'dietary',
  'dietaryCount',
  'guestCount',
  'totalBudget',
  'budgetPerGuest',
  'budgetTier',
  'daysUntilEvent',
  'minLeadDays',
  'idealLeadDays',
  'leadStatus',
  'month',
  'season',
  'peakWeddingSeason',
  'weekend',
];

import { describe, expect, it } from 'vitest';
import { findTemplate } from '../catalog/registry.js';
import { PLANNED_ON, weddingBrief } from '../test-utils/briefs.js';
import {
  CONTEXT_FIELDS,
  budgetTierOf,
  derivePlanningContext,
  leadStatusOf,
  perGuestOf,
} from './derive-context.js';

const wedding = findTemplate('wedding');

describe('derivePlanningContext', () => {
  it('derives timing, money and season facts from the brief', () => {
    const context = derivePlanningContext(weddingBrief, wedding, PLANNED_ON);
    expect(context).toMatchObject({
      eventType: 'wedding',
      eventLabel: 'wedding',
      daysUntilEvent: 111,
      leadStatus: 'tight',
      budgetPerGuest: 7200,
      budgetTier: 'premium',
      month: 2,
      season: 'winter',
      peakWeddingSeason: true,
      weekend: true,
      dietaryCount: 2,
    });
  });

  it('exposes exactly the documented fields', () => {
    expect(Object.keys(derivePlanningContext(weddingBrief, wedding, PLANNED_ON)).sort()).toEqual(
      [...CONTEXT_FIELDS].sort(),
    );
  });

  it('marks a weekday event as not on a weekend', () => {
    const context = derivePlanningContext(
      { ...weddingBrief, eventDate: '2027-02-17' },
      wedding,
      PLANNED_ON,
    );
    expect(context.weekend).toBe(false);
  });
});

describe('leadStatusOf', () => {
  it('grades the runway against the template', () => {
    expect(leadStatusOf(59, wedding)).toBe('rushed');
    expect(leadStatusOf(60, wedding)).toBe('tight');
    expect(leadStatusOf(149, wedding)).toBe('tight');
    expect(leadStatusOf(150, wedding)).toBe('comfortable');
  });
});

describe('budgetTierOf', () => {
  it('grades spend per guest against the template tiers', () => {
    expect(budgetTierOf(2499, wedding)).toBe('lean');
    expect(budgetTierOf(2500, wedding)).toBe('moderate');
    expect(budgetTierOf(6000, wedding)).toBe('premium');
  });
});

describe('perGuestOf', () => {
  it('rounds down and never divides by zero', () => {
    expect(perGuestOf({ ...weddingBrief, totalBudget: 1000, guestCount: 3 })).toBe(333);
    expect(perGuestOf({ ...weddingBrief, totalBudget: 1000, guestCount: 0 })).toBe(1000);
  });
});

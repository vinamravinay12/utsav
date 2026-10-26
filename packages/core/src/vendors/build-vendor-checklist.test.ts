import { describe, expect, it } from 'vitest';
import { allocateBudget } from '../budget/allocate-budget.js';
import { findTemplate } from '../catalog/registry.js';
import { derivePlanningContext } from '../context/derive-context.js';
import { addDays } from '../dates/iso-date.js';
import {
  PLANNED_ON,
  communityBrief,
  kidsBirthdayBrief,
  weddingBrief,
} from '../test-utils/briefs.js';
import type { EventBrief } from '../types/index.js';
import { buildVendorChecklist } from './build-vendor-checklist.js';

function vendorsFor(brief: EventBrief, plannedOn = PLANNED_ON) {
  const template = findTemplate(brief.eventType);
  const lines = allocateBudget(brief.totalBudget, template.budget, brief.priorities);
  return buildVendorChecklist(template, derivePlanningContext(brief, template, plannedOn), lines, {
    eventDate: brief.eventDate,
    plannedOn,
  });
}

describe('buildVendorChecklist', () => {
  it('prices each vendor from its share of the category budget', () => {
    const vendors = vendorsFor(weddingBrief);
    const decorator = vendors.find((vendor) => vendor.id === 'w-v-decor');
    const tent = vendors.find((vendor) => vendor.id === 'w-v-tent');
    expect(decorator?.estimatedCost).toBe(Math.round(262_440 * 0.85));
    expect(decorator?.estimatedDeposit).toBe(Math.round(Math.round(262_440 * 0.85) * 0.4));
    expect((decorator?.estimatedCost ?? 0) + (tent?.estimatedCost ?? 0)).toBe(262_440);
  });

  it('orders vendors by book-by date and never asks to book in the past', () => {
    const vendors = vendorsFor(weddingBrief);
    expect(vendors[0]?.id).toBe('w-v-venue');
    expect(vendors.every((vendor) => vendor.bookBy >= PLANNED_ON)).toBe(true);
    expect(
      vendors.every((vendor) => vendor.timing === 'compressed' || vendor.timing === 'on-track'),
    ).toBe(true);
  });

  it('books on the ideal lead when there is time', () => {
    const relaxed = { ...weddingBrief, eventDate: addDays(PLANNED_ON, 400) };
    expect(vendorsFor(relaxed).every((vendor) => vendor.timing === 'on-track')).toBe(true);
    expect(vendorsFor(relaxed).find((vendor) => vendor.id === 'w-v-venue')?.bookBy).toBe(
      addDays(relaxed.eventDate, -240),
    );
  });

  it('includes conditional vendors only when they apply', () => {
    const kids = vendorsFor(kidsBirthdayBrief).map((vendor) => vendor.id);
    expect(kids).toContain('b-v-play');
    expect(
      vendorsFor({ ...kidsBirthdayBrief, ageGroup: 'adults' }).map((vendor) => vendor.id),
    ).not.toContain('b-v-play');
    expect(vendorsFor(communityBrief).map((vendor) => vendor.id)).toEqual(
      expect.arrayContaining(['c-v-security', 'c-v-toilets']),
    );
  });

  it('marks every booking at risk when the event is inside the minimum lead time', () => {
    const vendors = vendorsFor(kidsBirthdayBrief);
    expect(vendors.filter((vendor) => vendor.timing !== 'at-risk')).toEqual([]);
  });

  it('prices a vendor at zero if its category has no budget line', () => {
    const template = findTemplate('wedding');
    const context = derivePlanningContext(weddingBrief, template, PLANNED_ON);
    const vendors = buildVendorChecklist(template, context, [], {
      eventDate: weddingBrief.eventDate,
      plannedOn: PLANNED_ON,
    });
    expect(vendors.every((vendor) => vendor.estimatedCost === 0)).toBe(true);
  });
});

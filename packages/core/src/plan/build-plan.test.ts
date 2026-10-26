import { describe, expect, it } from 'vitest';
import {
  PLANNED_ON,
  communityBrief,
  kidsBirthdayBrief,
  weddingBrief,
} from '../test-utils/briefs.js';
import { buildPlan } from './build-plan.js';

describe('buildPlan', () => {
  it('is deterministic', () => {
    expect(buildPlan(weddingBrief, PLANNED_ON)).toEqual(buildPlan(weddingBrief, PLANNED_ON));
  });

  it('plans a winter wedding end to end', () => {
    const plan = buildPlan(weddingBrief, PLANNED_ON);
    expect(plan).toMatchObject({
      eventLabel: 'Wedding',
      plannedOn: PLANNED_ON,
      daysUntilEvent: 111,
      leadStatus: 'tight',
      budget: { total: 1_800_000, perGuest: 7200, tier: 'premium', findings: [] },
    });
    expect(plan.budget.lines.reduce((sum, line) => sum + line.amount, 0)).toBe(1_800_000);
    expect(plan.tasks.length).toBeGreaterThan(15);
    expect(plan.vendors.length).toBeGreaterThan(5);
    expect(plan.ideas).toHaveLength(6);
    expect(plan.insights[0]?.severity).toBe('warning');
  });

  it('flags the budget shortfall and the rush for a last-minute children’s party', () => {
    const plan = buildPlan(kidsBirthdayBrief, PLANNED_ON);
    expect(plan.leadStatus).toBe('rushed');
    expect(plan.budget.tier).toBe('lean');
    expect(plan.budget.findings.map((finding) => finding.categoryId)).toEqual(['catering']);
    expect(plan.insights[0]?.id).toBe('lead-rushed');
  });

  it('puts safety and permits into a large community fair', () => {
    const plan = buildPlan(communityBrief, PLANNED_ON);
    const taskIds = plan.tasks.map((task) => task.id);
    expect(taskIds).toEqual(
      expect.arrayContaining([
        'c-permits',
        'c-sound-permit',
        'c-insurance',
        'c-crowd',
        'c-weather',
      ]),
    );
    expect(plan.leadStatus).toBe('comfortable');
    expect(plan.budget.lines.find((line) => line.categoryId === 'safety')?.prioritised).toBe(true);
  });

  it('refuses to plan an event in the past', () => {
    expect(() => buildPlan({ ...weddingBrief, eventDate: '2026-01-01' }, PLANNED_ON)).toThrow(
      RangeError,
    );
  });
});

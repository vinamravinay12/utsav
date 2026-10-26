import { describe, expect, it } from 'vitest';
import { eventTemplates, findTemplate } from '../catalog/registry.js';
import { derivePlanningContext } from '../context/derive-context.js';
import { addDays } from '../dates/iso-date.js';
import { PLANNED_ON, kidsBirthdayBrief, weddingBrief } from '../test-utils/briefs.js';
import { compressOffset, phaseOf, placeTask, scheduleTasks } from './schedule-tasks.js';

describe('phaseOf', () => {
  it('buckets days-before into planning phases', () => {
    expect([-3, 0, 7, 8, 30, 31, 90, 91, 180, 181].map(phaseOf)).toEqual([
      'after',
      'event-week',
      'event-week',
      'final-weeks',
      'final-weeks',
      'details',
      'details',
      'bookings',
      'bookings',
      'foundations',
    ]);
  });
});

describe('compressOffset', () => {
  it('leaves offsets alone when there is enough runway', () => {
    expect(compressOffset(240, 300, 300)).toBe(240);
    expect(compressOffset(40, 100, 300)).toBe(40);
  });

  it('maps the ideal horizon onto the time left without reordering', () => {
    expect(compressOffset(300, 100, 300)).toBe(100);
    const offsets = Array.from({ length: 301 }, (_, ideal) => compressOffset(ideal, 100, 300));
    for (let index = 1; index < offsets.length; index += 1) {
      expect(offsets[index]).toBeGreaterThanOrEqual(offsets[index - 1] ?? 0);
      expect(offsets[index]).toBeLessThanOrEqual(100);
    }
  });
});

describe('placeTask', () => {
  it('keeps the ideal offset when there is time', () => {
    expect(placeTask({ idealDaysBefore: 30, latestDaysBefore: 7 }, 200, 300)).toEqual({
      daysBefore: 30,
      timing: 'on-track',
    });
  });

  it('compresses but never past the latest workable point', () => {
    // Knee at 50 days: 50 + (240 - 50) × 50 / 250 = 88.
    expect(placeTask({ idealDaysBefore: 240, latestDaysBefore: 45 }, 100, 300)).toEqual({
      daysBefore: 88,
      timing: 'compressed',
    });
    // 120 compresses to 64, but this task cannot happen later than 70 days out.
    expect(placeTask({ idealDaysBefore: 120, latestDaysBefore: 70 }, 100, 300)).toEqual({
      daysBefore: 70,
      timing: 'compressed',
    });
  });

  it('is due now and at risk once even the latest point has passed', () => {
    expect(placeTask({ idealDaysBefore: 120, latestDaysBefore: 45 }, 30, 300)).toEqual({
      daysBefore: 30,
      timing: 'at-risk',
    });
  });
});

describe('scheduleTasks', () => {
  const wedding = findTemplate('wedding');
  const context = derivePlanningContext(weddingBrief, wedding, PLANNED_ON);
  const tasks = scheduleTasks(wedding, context, weddingBrief.eventDate, PLANNED_ON);

  it('includes conditional tasks only when they apply', () => {
    const ids = tasks.map((task) => task.id);
    expect(ids).toContain('w-rain');
    expect(ids).toContain('w-surplus');
    const indoorContext = derivePlanningContext(
      { ...weddingBrief, setting: 'indoor', style: 'modern', interests: [] },
      wedding,
      PLANNED_ON,
    );
    const indoor = scheduleTasks(wedding, indoorContext, weddingBrief.eventDate, PLANNED_ON).map(
      (task) => task.id,
    );
    expect(indoor).not.toContain('w-rain');
    expect(indoor).not.toContain('w-surplus');
  });

  it('sorts by due date and never schedules anything before the planning day', () => {
    const dueDates = tasks.map((task) => task.dueDate);
    expect(dueDates).toEqual([...dueDates].sort());
    expect(tasks.every((task) => task.dueDate >= PLANNED_ON)).toBe(true);
  });

  it('puts the event-day task on the day and follow-ups after it', () => {
    expect(tasks.find((task) => task.id === 'w-day')?.dueDate).toBe(weddingBrief.eventDate);
    expect(tasks.find((task) => task.id === 'w-thanks')).toMatchObject({
      dueDate: addDays(weddingBrief.eventDate, 14),
      phase: 'after',
      timing: 'on-track',
    });
  });

  it('lists essential tasks first when two fall due on the same day', () => {
    const sameDay = tasks.filter(
      (task) => task.dueDate === tasks.find((t) => t.id === 'w-menu')?.dueDate,
    );
    expect(sameDay.map((task) => task.essential)).toEqual(
      [...sameDay.map((task) => task.essential)].sort((a, b) => Number(b) - Number(a)),
    );
  });

  it('schedules every template sensibly with a full runway (no task compressed)', () => {
    for (const template of eventTemplates) {
      const brief = { ...weddingBrief, eventType: template.id, priorities: [] };
      const eventDate = addDays(PLANNED_ON, template.idealLeadDays);
      const planContext = derivePlanningContext({ ...brief, eventDate }, template, PLANNED_ON);
      const scheduled = scheduleTasks(template, planContext, eventDate, PLANNED_ON);
      expect(
        scheduled.every((task) => task.timing === 'on-track'),
        template.id,
      ).toBe(true);
    }
  });

  it('flags tasks at risk when a party is days away', () => {
    const birthday = findTemplate('birthday');
    const birthdayContext = derivePlanningContext(kidsBirthdayBrief, birthday, PLANNED_ON);
    const rushed = scheduleTasks(
      birthday,
      birthdayContext,
      kidsBirthdayBrief.eventDate,
      PLANNED_ON,
    );
    expect(rushed.filter((task) => task.timing === 'at-risk').map((task) => task.id)).toEqual([
      'b-budget',
      'b-venue',
    ]);
    expect(rushed.map((task) => task.id)).toContain('b-supervision');
  });
});

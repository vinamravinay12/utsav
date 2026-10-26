import { describe, expect, it } from 'vitest';
import { PLANNED_ON, weddingBrief } from '../test-utils/briefs.js';
import { completeBrief, findMissingFields } from './complete-brief.js';

describe('findMissingFields', () => {
  it('asks the required questions in order', () => {
    expect(
      findMissingFields({ eventType: 'birthday', city: 'Pune' }).map((issue) => issue.field),
    ).toEqual(['eventDate', 'guestCount', 'totalBudget', 'setting', 'style', 'ageGroup']);
    expect(findMissingFields({})[0]?.message).toBe('What kind of event is it?');
  });
});

describe('completeBrief', () => {
  it('completes a full draft as given', () => {
    expect(completeBrief({ ...weddingBrief }, PLANNED_ON)).toEqual({
      ok: true,
      brief: weddingBrief,
    });
  });

  it('names the event and defaults the lists when they are absent', () => {
    const { name: _name, priorities: _p, interests: _i, dietary: _d, ...rest } = weddingBrief;
    const result = completeBrief(rest, PLANNED_ON);
    expect(result.ok && result.brief).toMatchObject({
      name: 'Wedding in Jaipur',
      priorities: [],
      interests: [],
      dietary: [],
    });
  });

  it('lists what is missing', () => {
    const result = completeBrief({ eventType: 'wedding' }, PLANNED_ON);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.issues).toHaveLength(7);
  });

  it('rejects a date in the past or more than three years away', () => {
    expect(completeBrief({ ...weddingBrief, eventDate: '2026-10-25' }, PLANNED_ON)).toEqual({
      ok: false,
      issues: [{ field: 'eventDate', message: 'The event date has already passed.' }],
    });
    expect(completeBrief({ ...weddingBrief, eventDate: '2030-01-01' }, PLANNED_ON)).toEqual({
      ok: false,
      issues: [{ field: 'eventDate', message: 'Choose a date within the next three years.' }],
    });
  });

  it('accepts an event today', () => {
    expect(completeBrief({ ...weddingBrief, eventDate: PLANNED_ON }, PLANNED_ON).ok).toBe(true);
  });
});

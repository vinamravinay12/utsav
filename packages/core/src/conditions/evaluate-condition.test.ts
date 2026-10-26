import { describe, expect, it } from 'vitest';
import type { PlanningContext } from '../types/index.js';
import { applies, evaluateCondition, fieldsOf } from './evaluate-condition.js';

const context: PlanningContext = {
  setting: 'outdoor',
  guestCount: 120,
  weekend: true,
  interests: ['music', 'food'],
};

describe('evaluateCondition', () => {
  it('compares equality for strings, numbers and booleans', () => {
    expect(evaluateCondition({ field: 'setting', equals: 'outdoor' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'guestCount', equals: 120 }, context)).toBe(true);
    expect(evaluateCondition({ field: 'weekend', equals: false }, context)).toBe(false);
  });

  it('matches membership in a list of strings', () => {
    expect(evaluateCondition({ field: 'setting', oneOf: ['outdoor', 'mixed'] }, context)).toBe(
      true,
    );
    expect(evaluateCondition({ field: 'setting', oneOf: ['indoor'] }, context)).toBe(false);
    expect(evaluateCondition({ field: 'guestCount', oneOf: ['120'] }, context)).toBe(false);
  });

  it('checks whether a list field contains a value', () => {
    expect(evaluateCondition({ field: 'interests', has: 'music' }, context)).toBe(true);
    expect(evaluateCondition({ field: 'interests', has: 'dance' }, context)).toBe(false);
    expect(evaluateCondition({ field: 'setting', has: 'out' }, context)).toBe(false);
  });

  it('compares numbers with atLeast and below', () => {
    expect(evaluateCondition({ field: 'guestCount', atLeast: 120 }, context)).toBe(true);
    expect(evaluateCondition({ field: 'guestCount', atLeast: 121 }, context)).toBe(false);
    expect(evaluateCondition({ field: 'guestCount', below: 121 }, context)).toBe(true);
    expect(evaluateCondition({ field: 'guestCount', below: 120 }, context)).toBe(false);
  });

  it('treats a missing or non-numeric field as false for numeric comparisons', () => {
    expect(evaluateCondition({ field: 'absent', atLeast: 0 }, context)).toBe(false);
    expect(evaluateCondition({ field: 'setting', below: 10 }, context)).toBe(false);
  });

  it('combines with all, any and not', () => {
    const outdoorAndLarge = {
      all: [
        { field: 'setting', equals: 'outdoor' },
        { field: 'guestCount', atLeast: 100 },
      ],
    } as const;
    expect(evaluateCondition(outdoorAndLarge, context)).toBe(true);
    expect(
      evaluateCondition(
        {
          any: [
            { field: 'setting', equals: 'indoor' },
            { field: 'weekend', equals: true },
          ],
        },
        context,
      ),
    ).toBe(true);
    expect(evaluateCondition({ not: outdoorAndLarge }, context)).toBe(false);
    expect(evaluateCondition({ all: [] }, context)).toBe(true);
    expect(evaluateCondition({ any: [] }, context)).toBe(false);
  });
});

describe('applies', () => {
  it('holds when there is no condition', () => {
    expect(applies(undefined, context)).toBe(true);
    expect(applies({ field: 'setting', equals: 'indoor' }, context)).toBe(false);
  });
});

describe('fieldsOf', () => {
  it('lists every field a nested condition reads', () => {
    expect(
      fieldsOf({
        all: [
          { field: 'a', equals: 1 },
          { any: [{ field: 'b', atLeast: 1 }, { not: { field: 'c', has: 'x' } }] },
        ],
      }),
    ).toEqual(['a', 'b', 'c']);
  });
});

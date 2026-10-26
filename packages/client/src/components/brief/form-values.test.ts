import { describe, expect, it } from 'vitest';
import { parseWholeNumber, priorityOptions, toDraft, toFormValues } from './form-values.js';

describe('form values', () => {
  it('turns a draft into form strings and back', () => {
    const values = toFormValues({
      eventType: 'wedding',
      guestCount: 250,
      priorities: ['decor', 3],
      interests: 'music',
      city: null,
    });
    expect(values).toMatchObject({
      eventType: 'wedding',
      guestCount: '250',
      priorities: ['decor'],
      interests: [],
      city: '',
    });
    expect(toDraft({ ...values, totalBudget: '18,00,000' })).toEqual({
      eventType: 'wedding',
      guestCount: 250,
      totalBudget: 1_800_000,
      priorities: ['decor'],
      interests: [],
      dietary: [],
    });
  });

  it('reads whole numbers written the Indian way and rejects anything else', () => {
    expect(parseWholeNumber('₹ 1,50,000')).toBe(150_000);
    expect(parseWholeNumber('12.5')).toBeUndefined();
    expect(parseWholeNumber('')).toBeUndefined();
  });

  it('offers non-reserve categories for a known event type only', () => {
    expect(priorityOptions('birthday').map(([id]) => id)).toContain('cake');
    expect(priorityOptions('birthday').map(([id]) => id)).not.toContain('contingency');
    expect(priorityOptions('')).toEqual([]);
  });
});

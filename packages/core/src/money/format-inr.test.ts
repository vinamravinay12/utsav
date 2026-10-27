import { describe, expect, it } from 'vitest';
import { formatInr } from './format-inr.js';

describe('formatInr', () => {
  it('uses Indian digit grouping without paise', () => {
    expect(formatInr(1_800_000)).toBe('₹18,00,000');
    expect(formatInr(999)).toBe('₹999');
  });
});

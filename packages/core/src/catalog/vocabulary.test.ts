import { describe, expect, it } from 'vitest';
import { isPeakWeddingMonth, seasonOf } from './seasons.js';
import { STYLES, STYLE_IDS, isMember, labelOf } from './vocabulary.js';

describe('vocabulary', () => {
  it('looks up labels and falls back to the id', () => {
    expect(labelOf(STYLES, 'eco')).toBe('Eco-friendly');
    expect(labelOf(STYLES, 'unknown' as 'eco')).toBe('unknown');
  });

  it('narrows only known members', () => {
    expect(isMember(STYLE_IDS, 'rustic')).toBe(true);
    expect(isMember(STYLE_IDS, 'baroque')).toBe(false);
    expect(isMember(STYLE_IDS, 3)).toBe(false);
  });
});

describe('seasons', () => {
  it('maps every month to its Indian planning season', () => {
    expect([1, 3, 6, 9, 10, 12].map(seasonOf)).toEqual([
      'winter',
      'summer',
      'monsoon',
      'monsoon',
      'festive',
      'winter',
    ]);
  });

  it('falls back to winter for an out-of-range month', () => {
    expect(seasonOf(0)).toBe('winter');
  });

  it('knows the peak wedding months', () => {
    expect([11, 12, 1, 2].every(isPeakWeddingMonth)).toBe(true);
    expect(isPeakWeddingMonth(7)).toBe(false);
  });
});

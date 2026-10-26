import { describe, expect, it } from 'vitest';
import { boundedInteger, cleanText, memberList, normalizeDraft } from './normalize-draft.js';

describe('cleanText', () => {
  it('strips control characters and markup brackets, collapses whitespace and truncates', () => {
    expect(cleanText('  Asha\u0000 <b>&</b>\n Rohan  ', 80)).toBe('Asha b&/b Rohan');
    expect(cleanText('abcdef', 3)).toBe('abc');
  });

  it('returns undefined for non-strings and empty results', () => {
    expect(cleanText(42, 10)).toBeUndefined();
    expect(cleanText(' \n ', 10)).toBeUndefined();
  });
});

describe('boundedInteger', () => {
  it('accepts integers in range only', () => {
    expect(boundedInteger(250, 1, 5000)).toBe(250);
    expect(boundedInteger(0, 1, 5000)).toBeUndefined();
    expect(boundedInteger(12.5, 1, 5000)).toBeUndefined();
    expect(boundedInteger('250', 1, 5000)).toBeUndefined();
  });
});

describe('memberList', () => {
  it('keeps known, distinct values up to the limit', () => {
    expect(memberList(['a', 'b', 'c'], ['b', 'x', 'b', 'a', 'c'], 2)).toEqual(['b', 'a']);
    expect(memberList(['a'], 'a', 2)).toEqual([]);
  });
});

describe('normalizeDraft', () => {
  it('keeps every valid field', () => {
    expect(
      normalizeDraft({
        eventType: 'wedding',
        name: 'Asha & Rohan',
        eventDate: '2027-02-14',
        guestCount: 250,
        totalBudget: 1_800_000,
        city: 'Jaipur',
        setting: 'mixed',
        style: 'eco',
        ageGroup: 'all-ages',
        priorities: ['decor', 'cake', 'photography'],
        interests: ['food', 'astrology'],
        dietary: ['jain', 'keto'],
      }),
    ).toEqual({
      eventType: 'wedding',
      name: 'Asha & Rohan',
      eventDate: '2027-02-14',
      guestCount: 250,
      totalBudget: 1_800_000,
      city: 'Jaipur',
      setting: 'mixed',
      style: 'eco',
      ageGroup: 'all-ages',
      // 'cake' is a birthday category, not a wedding one.
      priorities: ['decor', 'photography'],
      interests: ['food'],
      dietary: ['jain'],
    });
  });

  it('drops anything outside the vocabulary or bounds instead of guessing', () => {
    expect(
      normalizeDraft({
        eventType: 'funeral',
        eventDate: '2027-02-30',
        guestCount: -4,
        totalBudget: 5,
        setting: 'underwater',
        style: 'baroque',
        ageGroup: 'babies',
        priorities: ['venue'],
      }),
    ).toEqual({ priorities: [], interests: [], dietary: [] });
  });

  it('ignores a non-string date', () => {
    expect(normalizeDraft({ eventDate: 20270214 })).toEqual({
      priorities: [],
      interests: [],
      dietary: [],
    });
  });
});

import { describe, expect, it } from 'vitest';
import { findTemplate } from '../catalog/registry.js';
import { communityBrief, kidsBirthdayBrief, weddingBrief } from '../test-utils/briefs.js';
import type { IdeaSpec } from '../types/index.js';
import { IDEA_LIMIT, PER_CATEGORY_LIMIT, rankIdeas } from './rank-ideas.js';

const idea = (id: string, extra: Partial<IdeaSpec> = {}): IdeaSpec => ({
  id,
  title: id,
  description: '',
  category: id,
  costTier: 'low',
  styles: [],
  interests: [],
  settings: [],
  ageGroups: [],
  ...extra,
});

describe('rankIdeas', () => {
  it('ranks by style, then shared interests, then setting and audience', () => {
    const ideas = [
      idea('plain'),
      idea('setting', { settings: ['mixed'] }),
      idea('interest', { interests: ['food'] }),
      idea('style', { styles: ['eco'] }),
    ];
    expect(rankIdeas(ideas, weddingBrief, 'premium').map((ranked) => ranked.id)).toEqual([
      'style',
      'interest',
      'setting',
      'plain',
    ]);
  });

  it('explains every pick in plain words', () => {
    const [ranked] = rankIdeas(
      [
        idea('x', {
          styles: ['eco'],
          interests: ['food', 'sustainability'],
          settings: ['mixed'],
          ageGroups: ['all-ages'],
          costTier: 'mid',
        }),
      ],
      weddingBrief,
      'premium',
    );
    expect(ranked?.score).toBe(3 + 4 + 1 + 1);
    expect(ranked?.reasons).toEqual([
      'Matches your eco-friendly style',
      'Plays to food and sustainability',
      'Made for an indoor and outdoor setting',
      'Right for your guests’ ages',
      'Fits a moderate budget',
    ]);
  });

  it('never shows an idea the budget cannot afford', () => {
    const ideas = [
      idea('low'),
      idea('mid', { costTier: 'mid' }),
      idea('high', { costTier: 'high' }),
    ];
    expect(rankIdeas(ideas, weddingBrief, 'lean').map((ranked) => ranked.id)).toEqual(['low']);
    expect(rankIdeas(ideas, weddingBrief, 'moderate').map((ranked) => ranked.id)).toEqual([
      'low',
      'mid',
    ]);
    expect(rankIdeas(ideas, weddingBrief, 'premium')).toHaveLength(3);
  });

  it('drops ideas that do not work in the setting or for the audience', () => {
    const ideas = [
      idea('outdoor-only', { settings: ['outdoor'] }),
      idea('kids-only', { ageGroups: ['kids'] }),
    ];
    expect(
      rankIdeas(ideas, { ...weddingBrief, setting: 'indoor', ageGroup: 'adults' }, 'premium'),
    ).toEqual([]);
    // A mixed-age crowd can use an idea aimed at any one age group.
    expect(rankIdeas(ideas, { ...weddingBrief, setting: 'outdoor' }, 'premium')).toHaveLength(2);
  });

  it('caps picks per category and overall', () => {
    const ideas = Array.from({ length: 10 }, (_, index) =>
      idea(`i${String(index)}`, { category: index < 5 ? 'decor' : `c${String(index)}` }),
    );
    const ranked = rankIdeas(ideas, weddingBrief, 'premium');
    expect(ranked).toHaveLength(IDEA_LIMIT);
    expect(ranked.filter((entry) => entry.category === 'decor')).toHaveLength(PER_CATEGORY_LIMIT);
  });

  it('personalises the real catalogue for each sample brief', () => {
    const eco = rankIdeas(findTemplate('wedding').ideas, weddingBrief, 'premium');
    expect(eco[0]?.id).toBe('w-i-leaf-meal');
    const kids = rankIdeas(findTemplate('birthday').ideas, kidsBirthdayBrief, 'lean');
    expect(kids.every((entry) => entry.costTier === 'low')).toBe(true);
    expect(kids.map((entry) => entry.id)).toContain('b-i-sports');
    const fair = rankIdeas(findTemplate('community').ideas, communityBrief, 'moderate');
    expect(fair[0]?.id).toBe('c-i-trees');
    expect(fair.map((entry) => entry.id)).toContain('c-i-zero-waste');
  });
});

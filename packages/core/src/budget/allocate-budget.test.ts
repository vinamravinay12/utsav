import { describe, expect, it } from 'vitest';
import { eventTemplates, findTemplate } from '../catalog/registry.js';
import type { BudgetCategorySpec } from '../types/index.js';
import { allocateBudget, effectiveShares } from './allocate-budget.js';

const wedding = findTemplate('wedding');
const shareOf = (id: string, priorities: readonly string[] = []): number =>
  effectiveShares(wedding.budget, priorities).find((share) => share.item.id === id)?.amount ?? -1;

describe('effectiveShares', () => {
  it('returns the template shares unchanged when nothing is prioritised', () => {
    expect(effectiveShares(wedding.budget, []).map((share) => share.amount)).toEqual(
      wedding.budget.map((category) => category.shareBp),
    );
  });

  it('boosts prioritised categories and still sums to 10 000', () => {
    const shares = effectiveShares(wedding.budget, ['decor']);
    expect(shares.reduce((sum, share) => sum + share.amount, 0)).toBe(10_000);
    expect(shareOf('decor', ['decor'])).toBeGreaterThan(shareOf('decor'));
    expect(shareOf('catering', ['decor'])).toBeLessThan(shareOf('catering'));
  });

  it('never touches the contingency reserve', () => {
    expect(shareOf('contingency', ['decor', 'catering', 'venue'])).toBe(1000);
  });

  it('copes with a category list that has no reserve', () => {
    const categories: BudgetCategorySpec[] = [
      { id: 'a', label: 'A', shareBp: 5000 },
      { id: 'b', label: 'B', shareBp: 5000 },
    ];
    expect(effectiveShares(categories, ['a']).map((share) => share.amount)).toEqual([5652, 4348]);
  });
});

describe('allocateBudget', () => {
  it('sums to the total exactly for every template and priority mix', () => {
    for (const template of eventTemplates) {
      for (const priorities of [
        [],
        [template.budget[0]?.id ?? ''],
        template.budget.slice(0, 3).map((c) => c.id),
      ]) {
        for (const total of [1000, 15_000, 123_457, 1_800_000, 99_999_999]) {
          const lines = allocateBudget(total, template.budget, priorities);
          expect(lines.reduce((sum, line) => sum + line.amount, 0)).toBe(total);
        }
      }
    }
  });

  it('labels each line and marks priorities and the reserve', () => {
    const lines = allocateBudget(1_000_000, wedding.budget, ['photography']);
    expect(lines.find((line) => line.categoryId === 'photography')).toMatchObject({
      label: 'Photo & video',
      prioritised: true,
      isContingency: false,
    });
    expect(lines.find((line) => line.categoryId === 'contingency')).toMatchObject({
      amount: 100_000,
      isContingency: true,
    });
  });
});

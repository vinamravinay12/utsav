import { describe, expect, it } from 'vitest';
import type { BudgetLine } from '../types/index.js';
import { summarizeSpending } from './summarize-spending.js';

const line = (categoryId: string, amount: number, extra: Partial<BudgetLine> = {}): BudgetLine => ({
  categoryId,
  label: categoryId.toUpperCase(),
  amount,
  shareBp: 0,
  prioritised: false,
  isContingency: false,
  ...extra,
});

const budget: BudgetLine[] = [
  line('venue', 100_000),
  line('catering', 100_000, { prioritised: true }),
  line('decor', 50_000),
  line('reserve', 20_000, { isContingency: true }),
];

describe('summarizeSpending', () => {
  it('reports totals and a status per category', () => {
    const summary = summarizeSpending(budget, { venue: 95_000, catering: 40_000 });
    expect(summary.totalAllocated).toBe(270_000);
    expect(summary.totalSpent).toBe(135_000);
    expect(summary.totalRemaining).toBe(135_000);
    expect(summary.lines.map((entry) => entry.status)).toEqual([
      'near-limit',
      'on-track',
      'unspent',
      'unspent',
    ]);
    expect(summary.suggestions).toEqual([]);
    expect(summary.uncovered).toBe(0);
  });

  it('covers an overspend from the reserve first', () => {
    const summary = summarizeSpending(budget, { venue: 110_000 });
    expect(summary.lines[0]?.status).toBe('over');
    expect(summary.suggestions).toEqual([
      {
        fromCategoryId: 'reserve',
        fromLabel: 'RESERVE',
        toCategoryId: 'venue',
        toLabel: 'VENUE',
        amount: 10_000,
      },
    ]);
  });

  it('then takes from unprioritised categories with the most headroom, protecting priorities', () => {
    const summary = summarizeSpending(budget, { venue: 150_000, decor: 10_000 });
    expect(summary.suggestions.map((move) => [move.fromCategoryId, move.amount])).toEqual([
      ['reserve', 20_000],
      ['decor', 30_000],
    ]);
  });

  it('dips into priorities only when nothing else is left, and reports what stays uncovered', () => {
    const summary = summarizeSpending(budget, { venue: 300_000, decor: 50_000 });
    expect(summary.suggestions.map((move) => [move.fromCategoryId, move.amount])).toEqual([
      ['reserve', 20_000],
      ['catering', 100_000],
    ]);
    expect(summary.uncovered).toBe(80_000);
  });

  it('settles the largest overspend first when several categories run over', () => {
    const summary = summarizeSpending(budget, { venue: 105_000, decor: 70_000 });
    expect(
      summary.suggestions.map((move) => [move.toCategoryId, move.fromCategoryId, move.amount]),
    ).toEqual([
      ['decor', 'reserve', 20_000],
      ['venue', 'catering', 5_000],
    ]);
  });
});

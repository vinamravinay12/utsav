import { describe, expect, it } from 'vitest';
import { findTemplate } from '../catalog/registry.js';
import type { BudgetCategorySpec, BudgetLine } from '../types/index.js';
import { allocateBudget } from './allocate-budget.js';
import { assessFeasibility } from './assess-feasibility.js';

const wedding = findTemplate('wedding');

describe('assessFeasibility', () => {
  it('finds nothing wrong with a well-funded brief', () => {
    const lines = allocateBudget(1_800_000, wedding.budget, []);
    expect(assessFeasibility(lines, wedding.budget, 250, 1_800_000)).toEqual([]);
  });

  it('says how many guests the money covers and what budget would cover everyone', () => {
    const total = 500_000;
    const lines = allocateBudget(total, wedding.budget, []);
    const findings = assessFeasibility(lines, wedding.budget, 300, total);
    const catering = findings.find((finding) => finding.categoryId === 'catering');
    // 27% of 5 lakh is 1,35,000: ₹450 a plate against an ₹800 floor.
    expect(catering).toEqual({
      categoryId: 'catering',
      label: 'Catering',
      perGuest: 450,
      minPerGuest: 800,
      affordableGuests: 168,
      budgetNeeded: 888_889,
    });
    // The remedies are exact: at the suggested numbers the floor is met.
    expect(Math.floor(135_000 / 168)).toBeGreaterThanOrEqual(800);
    expect(Math.floor((888_889 * 0.27) / 300)).toBeGreaterThanOrEqual(800);
  });

  it('skips categories without a floor, without a line, or with nothing allocated', () => {
    const categories: BudgetCategorySpec[] = [
      { id: 'a', label: 'A', shareBp: 5000, minPerGuest: 10 },
      { id: 'b', label: 'B', shareBp: 5000, minPerGuest: 10 },
      { id: 'c', label: 'C', shareBp: 0 },
    ];
    const lines: BudgetLine[] = [
      {
        categoryId: 'a',
        label: 'A',
        amount: 0,
        shareBp: 0,
        prioritised: false,
        isContingency: false,
      },
      {
        categoryId: 'c',
        label: 'C',
        amount: 5,
        shareBp: 0,
        prioritised: false,
        isContingency: false,
      },
    ];
    expect(assessFeasibility(lines, categories, 10, 5)).toEqual([]);
  });
});

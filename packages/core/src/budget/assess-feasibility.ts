import type { BudgetCategorySpec, BudgetFinding, BudgetLine } from '../types/index.js';

/**
 * Checks each per-guest category against the floor below which it cannot
 * realistically be delivered, and says what would fix it.
 *
 * Two remedies are computed because hosts choose differently: invite fewer
 * people, or find more money. Both are exact for the current allocation.
 */
export function assessFeasibility(
  lines: readonly BudgetLine[],
  categories: readonly BudgetCategorySpec[],
  guestCount: number,
  total: number,
): BudgetFinding[] {
  return categories.flatMap((category): BudgetFinding[] => {
    const line = lines.find((candidate) => candidate.categoryId === category.id);
    if (category.minPerGuest === undefined || line === undefined || line.amount === 0) {
      return [];
    }
    const perGuest = Math.floor(line.amount / guestCount);
    if (perGuest >= category.minPerGuest) {
      return [];
    }
    const share = line.amount / total;
    return [
      {
        categoryId: category.id,
        label: category.label,
        perGuest,
        minPerGuest: category.minPerGuest,
        affordableGuests: Math.floor(line.amount / category.minPerGuest),
        budgetNeeded: Math.ceil((category.minPerGuest * guestCount) / share),
      },
    ];
  });
}

import { allocateByWeight, type Allocation } from '../money/allocate.js';
import type { BudgetCategorySpec, BudgetLine } from '../types/index.js';

/** How much more weight a prioritised category gets before renormalising. */
export const PRIORITY_BOOST = 1.3;

/** A whole budget expressed in basis points (1 bp = 0.01%). */
export const BASIS_POINTS = 10_000;

/**
 * Turns template shares and the host's priorities into effective shares.
 *
 * Prioritised categories are boosted, then every non-reserve category is scaled
 * back so the whole still sums to 10 000 basis points. The contingency reserve
 * is never squeezed to pay for priorities: it is what absorbs overruns later.
 */
export function effectiveShares(
  categories: readonly BudgetCategorySpec[],
  priorities: readonly string[],
): Allocation<BudgetCategorySpec>[] {
  const reserve = categories.find((category) => category.isContingency)?.shareBp ?? 0;
  const boostedWeight = (category: BudgetCategorySpec): number =>
    category.shareBp * (priorities.includes(category.id) ? PRIORITY_BOOST : 1);
  const spendable = categories.filter((category) => category.isContingency !== true);
  const boostedTotal = spendable.reduce((total, category) => total + boostedWeight(category), 0);
  const scale = (BASIS_POINTS - reserve) / boostedTotal;
  return allocateByWeight(BASIS_POINTS, categories, (category) =>
    category.isContingency === true ? reserve : boostedWeight(category) * scale,
  );
}

/** Splits the total across categories; the lines always sum to the total exactly. */
export function allocateBudget(
  total: number,
  categories: readonly BudgetCategorySpec[],
  priorities: readonly string[],
): BudgetLine[] {
  const shares = effectiveShares(categories, priorities);
  return allocateByWeight(total, shares, (share) => share.amount).map(
    ({ item: { item: category, amount: shareBp }, amount }) => ({
      categoryId: category.id,
      label: category.label,
      amount,
      shareBp,
      prioritised: priorities.includes(category.id),
      isContingency: category.isContingency === true,
    }),
  );
}

import type { BudgetLine } from '../types/index.js';

export type SpendStatus = 'unspent' | 'on-track' | 'near-limit' | 'over';

export interface SpendingLine {
  readonly categoryId: string;
  readonly label: string;
  readonly allocated: number;
  readonly spent: number;
  readonly remaining: number;
  readonly status: SpendStatus;
  readonly shareBp: number;
  readonly prioritised: boolean;
  readonly isContingency: boolean;
}

export interface Reallocation {
  readonly fromCategoryId: string;
  readonly fromLabel: string;
  readonly toCategoryId: string;
  readonly toLabel: string;
  readonly amount: number;
}

export interface SpendingSummary {
  readonly lines: readonly SpendingLine[];
  readonly totalAllocated: number;
  readonly totalSpent: number;
  readonly totalRemaining: number;
  readonly suggestions: readonly Reallocation[];
  /** Overspend no remaining headroom can cover: the budget itself must grow. */
  readonly uncovered: number;
}

/** Spend at or above this share of a category's allocation is flagged early. */
const NEAR_LIMIT = 0.9;

/** How a category’s spend compares with its allocation. */
function statusOf(spent: number, allocated: number): SpendStatus {
  if (spent === 0) {
    return 'unspent';
  }
  if (spent > allocated) {
    return 'over';
  }
  return spent >= allocated * NEAR_LIMIT ? 'near-limit' : 'on-track';
}

/**
 * Donors in the order money should be taken from them: the reserve first, then
 * categories the host did not prioritise, then — only if still short — the
 * prioritised ones. Within each group, the most headroom goes first.
 */
function donorRank(line: SpendingLine): number {
  if (line.isContingency) {
    return 0;
  }
  return line.prioritised ? 2 : 1;
}

/**
 * Covers each overspent category from donors in `donorRank` order, largest
 * overspend first, and reports whatever no donor can cover.
 */
function suggestReallocations(lines: readonly SpendingLine[]): {
  suggestions: Reallocation[];
  uncovered: number;
} {
  const donors = lines
    .filter((line) => line.remaining > 0)
    .map((line) => ({ line, headroom: line.remaining }))
    .sort(
      (first, second) =>
        donorRank(first.line) - donorRank(second.line) || second.headroom - first.headroom,
    );
  const overspent = lines
    .filter((line) => line.status === 'over')
    .sort((first, second) => first.remaining - second.remaining);
  const suggestions: Reallocation[] = [];
  let uncovered = 0;
  for (const over of overspent) {
    let need = -over.remaining;
    for (const donor of donors) {
      const amount = Math.min(need, donor.headroom);
      if (amount > 0) {
        donor.headroom -= amount;
        need -= amount;
        suggestions.push({
          fromCategoryId: donor.line.categoryId,
          fromLabel: donor.line.label,
          toCategoryId: over.categoryId,
          toLabel: over.label,
          amount,
        });
      }
    }
    uncovered += need;
  }
  return { suggestions, uncovered };
}

/**
 * Compares what has been spent against the plan, and when a category runs
 * over, proposes exactly where to move money from to cover it.
 */
export function summarizeSpending(
  budget: readonly BudgetLine[],
  spent: Readonly<Record<string, number>>,
): SpendingSummary {
  const lines = budget.map((line): SpendingLine => {
    const amount = spent[line.categoryId] ?? 0;
    return {
      categoryId: line.categoryId,
      label: line.label,
      allocated: line.amount,
      spent: amount,
      remaining: line.amount - amount,
      status: statusOf(amount, line.amount),
      shareBp: line.shareBp,
      prioritised: line.prioritised,
      isContingency: line.isContingency,
    };
  });
  const totalAllocated = lines.reduce((total, line) => total + line.allocated, 0);
  const totalSpent = lines.reduce((total, line) => total + line.spent, 0);
  return {
    lines,
    totalAllocated,
    totalSpent,
    totalRemaining: totalAllocated - totalSpent,
    ...suggestReallocations(lines),
  };
}

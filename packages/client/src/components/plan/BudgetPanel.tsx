import { formatInr, summarizeSpending, type EventPlan, type SpendingSummary } from '@utsav/core';
import { useMemo } from 'react';
import { BudgetTable } from './BudgetTable.js';

interface BudgetPanelProps {
  readonly plan: EventPlan;
  readonly spent: Readonly<Record<string, number>>;
  readonly onSpent: (categoryId: string, amount: number) => void;
}

/** Where to move money from to cover overspending; renders nothing while on budget. */
function Rebalance({ summary }: { readonly summary: SpendingSummary }): React.JSX.Element | null {
  if (summary.suggestions.length === 0 && summary.uncovered === 0) {
    return null;
  }
  return (
    <section className="card" aria-labelledby="rebalance-heading">
      <h3 id="rebalance-heading" className="mb-2 font-semibold">
        How to cover the overspend
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {summary.suggestions.map((move) => (
          <li key={`${move.fromCategoryId}-${move.toCategoryId}`}>
            Move {formatInr(move.amount)} from {move.fromLabel} to {move.toLabel}.
          </li>
        ))}
      </ul>
      {summary.uncovered > 0 && (
        <p className="mt-2 text-sm font-semibold text-danger-fg">
          {formatInr(summary.uncovered)} cannot be covered from what is left. The total budget needs
          to grow, or spending elsewhere needs to come down.
        </p>
      )}
    </section>
  );
}

/** Where the money goes, what has been spent, and how to cover any overrun. */
export function BudgetPanel({ plan, spent, onSpent }: BudgetPanelProps): React.JSX.Element {
  const summary = useMemo(
    () => summarizeSpending(plan.budget.lines, spent),
    [plan.budget.lines, spent],
  );
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">
        Budget: {formatInr(plan.budget.total)} · {formatInr(plan.budget.perGuest)} per guest
      </h2>
      <p className="text-sm text-muted">
        Split by Utsav’s planning rules, with your priorities given a larger share and a reserve
        kept aside for overruns. Enter what you spend and the plan rebalances.
      </p>
      <BudgetTable summary={summary} onSpent={onSpent} />
      <div aria-live="polite">
        <Rebalance summary={summary} />
      </div>
    </div>
  );
}

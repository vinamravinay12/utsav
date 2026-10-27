import { formatInr, type SpendingLine, type SpendingSummary } from '@utsav/core';
import { parseWholeNumber } from '../brief/form-values.js';
import { Badge } from '../ui/Badge.js';
import { SPEND } from './labels.js';

/** Basis points as a percentage with one decimal, e.g. 1869 → "18.7%". */
const percent = (shareBp: number): string => `${(shareBp / 100).toFixed(1)}%`;

interface RowProps {
  readonly line: SpendingLine;
  readonly onSpent: (categoryId: string, amount: number) => void;
}

/** One category: its share, planned amount, spend input, what is left and its status. */
function BudgetRow({ line, onSpent }: RowProps): React.JSX.Element {
  const [label, tone] = SPEND[line.status];
  return (
    <tr className="border-b border-line last:border-0">
      <th scope="row" className="px-4 py-3 font-medium">
        {line.label}
        {line.prioritised && <span className="ml-2 text-xs text-accent">priority</span>}
        <span className="block text-xs font-normal text-muted">
          {percent(line.shareBp)} of total
        </span>
      </th>
      <td className="px-4 py-3 text-right tabular-nums">{formatInr(line.allocated)}</td>
      <td className="px-4 py-3">
        <input
          type="text"
          inputMode="numeric"
          aria-label={`Spent so far on ${line.label}`}
          className="field w-32 py-1.5"
          defaultValue={line.spent === 0 ? '' : String(line.spent)}
          onBlur={(event) => {
            const amount = parseWholeNumber(event.target.value) ?? 0;
            if (amount !== line.spent) {
              onSpent(line.categoryId, amount);
            }
          }}
        />
      </td>
      <td
        className={`px-4 py-3 text-right tabular-nums ${line.remaining < 0 ? 'font-semibold text-danger-fg' : ''}`}
      >
        {formatInr(line.remaining)}
      </td>
      <td className="px-4 py-3">
        <Badge tone={tone}>{label}</Badge>
      </td>
    </tr>
  );
}

interface TableProps {
  readonly summary: SpendingSummary;
  readonly onSpent: RowProps['onSpent'];
}

/** Planned against spent for every category, with a spend input per row and totals. */
export function BudgetTable({ summary, onSpent }: TableProps): React.JSX.Element {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Budget by category, with spending so far</caption>
        <thead className="border-b border-line bg-brand-soft">
          <tr>
            <th scope="col" className="px-4 py-3">
              Category
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Planned
            </th>
            <th scope="col" className="px-4 py-3">
              Spent so far (₹)
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Left
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.lines.map((line) => (
            <BudgetRow key={line.categoryId} line={line} onSpent={onSpent} />
          ))}
        </tbody>
        <tfoot className="border-t border-line font-semibold">
          <tr>
            <th scope="row" className="px-4 py-3">
              Total
            </th>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatInr(summary.totalAllocated)}
            </td>
            <td className="px-4 py-3 tabular-nums">{formatInr(summary.totalSpent)}</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatInr(summary.totalRemaining)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

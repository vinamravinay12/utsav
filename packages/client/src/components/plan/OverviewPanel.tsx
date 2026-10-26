import { formatInr, type EventPlan, type ProgressSummary, type ScheduledTask } from '@utsav/core';
import { formatDate } from '../../lib/dates.js';
import { Badge } from '../ui/Badge.js';
import { SEVERITY } from './labels.js';

interface OverviewPanelProps {
  readonly plan: EventPlan;
  readonly progress: ProgressSummary;
}

function TaskList({
  title,
  tasks,
  empty,
}: {
  readonly title: string;
  readonly tasks: readonly ScheduledTask[];
  readonly empty: string;
}) {
  return (
    <section className="card" aria-labelledby={`${title}-heading`}>
      <h3 id={`${title}-heading`} className="mb-2 font-semibold">
        {title}
      </h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-wrap justify-between gap-2 text-sm">
              <span>{task.title}</span>
              <span className="text-muted">by {formatDate(task.dueDate)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** What needs attention now: risks for this brief, overdue work and the next three tasks. */
export function OverviewPanel({ plan, progress }: OverviewPanelProps): React.JSX.Element {
  return (
    <div className="space-y-5">
      <h2 className="sr-only">Overview</h2>
      {plan.budget.findings.map((finding) => (
        <div key={finding.categoryId} className="card border-danger-solid">
          <p className="mb-1">
            <Badge tone="danger">Budget gap</Badge>
          </p>
          <p className="font-semibold">
            {finding.label}: {formatInr(finding.perGuest)} per guest, below the realistic minimum of{' '}
            {formatInr(finding.minPerGuest)}.
          </p>
          <p className="text-sm text-ink-soft">
            Either invite about {finding.affordableGuests} guests, or raise the total budget to
            around {formatInr(finding.budgetNeeded)}.
          </p>
        </div>
      ))}
      <div className="grid gap-4 md:grid-cols-2">
        <TaskList
          title="Overdue"
          tasks={progress.overdueTasks}
          empty="Nothing overdue. Well done."
        />
        <TaskList title="Up next" tasks={progress.upNext} empty="Every task is done." />
      </div>
      <section aria-labelledby="insights-heading" className="space-y-3">
        <h3 id="insights-heading" className="text-lg font-semibold">
          Things to know for this event
        </h3>
        <ul className="space-y-3">
          {plan.insights.map((insight) => {
            const [label, tone] = SEVERITY[insight.severity];
            return (
              <li key={insight.id} className="card">
                <p className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge tone={tone}>{label}</Badge>
                  <span className="font-semibold">{insight.title}</span>
                </p>
                <p className="text-sm text-ink-soft">{insight.detail}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

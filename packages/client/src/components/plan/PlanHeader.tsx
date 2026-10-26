import { formatInr, type EventPlan, type ProgressSummary } from '@utsav/core';
import { describeCountdown, formatLongDate } from '../../lib/dates.js';

interface PlanHeaderProps {
  readonly plan: EventPlan;
  readonly progress: ProgressSummary;
  readonly daysLeft: number;
  readonly onEdit: () => void;
  readonly onExportCalendar: () => void;
  readonly onReset: () => void;
}

function Readiness({ progress }: { readonly progress: ProgressSummary }): React.JSX.Element {
  return (
    <div>
      <label htmlFor="readiness" className="flex justify-between text-sm font-semibold">
        <span>Plan readiness</span>
        <span>{progress.readiness}%</span>
      </label>
      <progress id="readiness" className="progress mt-1" max={100} value={progress.readiness}>
        {progress.readiness}%
      </progress>
      <p className="mt-1 text-sm text-muted">
        {progress.tasksDone} of {progress.tasksTotal} tasks done · {progress.vendorsBooked} of{' '}
        {progress.vendorsTotal} vendors booked · {progress.essentialRemaining} essential tasks left
      </p>
    </div>
  );
}

function Actions({
  onEdit,
  onExportCalendar,
  onReset,
}: Pick<PlanHeaderProps, 'onEdit' | 'onExportCalendar' | 'onReset'>) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <button type="button" className="btn-secondary" onClick={onEdit}>
        Edit details
      </button>
      <button type="button" className="btn-secondary" onClick={onExportCalendar}>
        Add timeline to calendar (.ics)
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          window.print();
        }}
      >
        Print or save as PDF
      </button>
      <button type="button" className="btn-secondary" onClick={onReset}>
        Start a new plan
      </button>
    </div>
  );
}

export function PlanHeader({
  plan,
  progress,
  daysLeft,
  ...actions
}: PlanHeaderProps): React.JSX.Element {
  const { brief } = plan;
  return (
    <section aria-labelledby="plan-title" className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">
            {plan.eventLabel} plan
          </p>
          <h1 id="plan-title" className="text-2xl font-bold sm:text-3xl">
            {brief.name}
          </h1>
          <p className="text-ink-soft">
            {formatLongDate(brief.eventDate)} · {brief.city} · {brief.guestCount} guests ·{' '}
            {formatInr(brief.totalBudget)}
          </p>
        </div>
        <p className="rounded-lg bg-brand-soft px-4 py-2 text-lg font-bold text-brand">
          {describeCountdown(daysLeft)}
        </p>
      </div>
      <Readiness progress={progress} />
      <Actions {...actions} />
    </section>
  );
}

import type { ScheduledTask } from '@utsav/core';
import { formatDate } from '../../lib/dates.js';
import { Badge } from '../ui/Badge.js';
import { PHASE_LABELS, PHASE_ORDER, TIMING } from './labels.js';

interface TimelinePanelProps {
  readonly tasks: readonly ScheduledTask[];
  readonly done: ReadonlySet<string>;
  readonly today: string;
  readonly onToggle: (taskId: string) => void;
}

function TaskItem({
  task,
  checked,
  overdue,
  onToggle,
}: {
  readonly task: ScheduledTask;
  readonly checked: boolean;
  readonly overdue: boolean;
  readonly onToggle: (taskId: string) => void;
}) {
  const [timingLabel, timingTone] = TIMING[task.timing];
  const detailId = `task-${task.id}-detail`;
  return (
    <li className="flex gap-3 border-b border-line py-3 last:border-0">
      <input
        id={`task-${task.id}`}
        type="checkbox"
        className="mt-1 size-5 shrink-0 accent-brand"
        checked={checked}
        aria-describedby={detailId}
        onChange={() => {
          onToggle(task.id);
        }}
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`task-${task.id}`}
          className={`font-medium ${checked ? 'text-muted line-through' : ''}`}
        >
          {task.title}
        </label>
        <p id={detailId} className="text-sm text-ink-soft">
          {task.detail}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>Due {formatDate(task.dueDate)}</span>
          {task.essential && <Badge tone="neutral">Essential</Badge>}
          {!checked && overdue && <Badge tone="danger">Overdue</Badge>}
          {!checked && task.timing !== 'on-track' && <Badge tone={timingTone}>{timingLabel}</Badge>}
        </p>
      </div>
    </li>
  );
}

/** Every task with a real date, grouped into phases, ticked off as the host goes. */
export function TimelinePanel({
  tasks,
  done,
  today,
  onToggle,
}: TimelinePanelProps): React.JSX.Element {
  const phases = PHASE_ORDER.map(
    (phase) => [phase, tasks.filter((task) => task.phase === phase)] as const,
  ).filter(([, phaseTasks]) => phaseTasks.length > 0);
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">
        Timeline · {done.size} of {tasks.length} done
      </h2>
      {phases.map(([phase, phaseTasks]) => (
        <section key={phase} className="card" aria-labelledby={`phase-${phase}`}>
          <h3 id={`phase-${phase}`} className="font-semibold text-brand">
            {PHASE_LABELS[phase]}
          </h3>
          <ul>
            {phaseTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                checked={done.has(task.id)}
                overdue={task.dueDate < today}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

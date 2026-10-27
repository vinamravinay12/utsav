import { buildPlan, daysBetween, summarizeProgress, toICalendar } from '@utsav/core';
import { useCallback, useMemo, useState } from 'react';
import type { AiIdea } from '../../api/types.js';
import { downloadFile, slugify } from '../../lib/download.js';
import type { PlannerAction } from '../../state/planner-reducer.js';
import type { SavedPlan } from '../../state/saved-plan.js';
import { useAiIdeas } from '../../state/use-ai-ideas.js';
import { PlanHeader } from './PlanHeader.js';
import { planTabs } from './plan-tabs.js';
import { Tabs } from './Tabs.js';

interface PlanDashboardProps {
  readonly saved: SavedPlan;
  readonly today: string;
  readonly dispatch: (action: PlannerAction) => void;
}

/**
 * The plan. Rebuilt from the brief on every load rather than stored, so a
 * saved plan always reflects the current planning rules; only the host's own
 * progress is persisted.
 */
export default function PlanDashboard({
  saved,
  today,
  dispatch,
}: PlanDashboardProps): React.JSX.Element {
  const plan = useMemo(
    () => buildPlan(saved.brief, saved.plannedOn),
    [saved.brief, saved.plannedOn],
  );
  const done = useMemo(() => new Set(saved.done), [saved.done]);
  const progress = summarizeProgress(
    plan.tasks,
    plan.vendors,
    { done, vendorStatus: saved.vendorStatus },
    today,
  );
  const [tab, setTab] = useState('overview');
  const onIdeas = useCallback(
    (ideas: readonly AiIdea[]) => {
      dispatch({ type: 'ai-ideas', ideas });
    },
    [dispatch],
  );
  const ai = useAiIdeas(saved.brief, today, onIdeas);
  const exportCalendar = (): void => {
    const pending = new Set(plan.tasks.filter((task) => !done.has(task.id)).map((task) => task.id));
    downloadFile(`${slugify(saved.brief.name)}.ics`, toICalendar(plan, pending), 'text/calendar');
  };
  return (
    <div className="space-y-6">
      <PlanHeader
        plan={plan}
        progress={progress}
        daysLeft={daysBetween(today, saved.brief.eventDate)}
        onEdit={() => {
          dispatch({ type: 'edit-brief' });
        }}
        onExportCalendar={exportCalendar}
      />
      <Tabs
        label="Plan sections"
        tabs={planTabs({ plan, saved, progress, done, today, ai, dispatch })}
        active={tab}
        onSelect={setTab}
      />
    </div>
  );
}

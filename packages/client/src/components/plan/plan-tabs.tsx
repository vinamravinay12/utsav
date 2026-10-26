import type { EventPlan, ProgressSummary } from '@utsav/core';
import type { PlannerAction } from '../../state/planner-reducer.js';
import type { SavedPlan } from '../../state/saved-plan.js';
import type { AiIdeasRequest } from '../../state/use-ai-ideas.js';
import { BudgetPanel } from './BudgetPanel.js';
import { IdeasPanel } from './IdeasPanel.js';
import { OverviewPanel } from './OverviewPanel.js';
import type { TabDefinition } from './Tabs.js';
import { TimelinePanel } from './TimelinePanel.js';
import { VendorsPanel } from './VendorsPanel.js';

export interface PlanTabsInput {
  readonly plan: EventPlan;
  readonly saved: SavedPlan;
  readonly progress: ProgressSummary;
  readonly done: ReadonlySet<string>;
  readonly today: string;
  readonly ai: AiIdeasRequest;
  readonly dispatch: (action: PlannerAction) => void;
}

const budgetContent = ({ plan, saved, dispatch }: PlanTabsInput): React.ReactNode => (
  <BudgetPanel
    plan={plan}
    spent={saved.spent}
    onSpent={(categoryId, amount) => {
      dispatch({ type: 'spent', categoryId, amount });
    }}
  />
);

const timelineContent = ({ plan, done, today, dispatch }: PlanTabsInput): React.ReactNode => (
  <TimelinePanel
    tasks={plan.tasks}
    done={done}
    today={today}
    onToggle={(taskId) => {
      dispatch({ type: 'toggle-task', taskId });
    }}
  />
);

const vendorsContent = ({ plan, saved, today, dispatch }: PlanTabsInput): React.ReactNode => (
  <VendorsPanel
    vendors={plan.vendors}
    status={saved.vendorStatus}
    today={today}
    onStatus={(vendorId, status) => {
      dispatch({ type: 'vendor-status', vendorId, status });
    }}
  />
);

const ideasContent = ({ plan, saved, ai }: PlanTabsInput): React.ReactNode => (
  <IdeasPanel
    ideas={plan.ideas}
    aiIdeas={saved.aiIdeas}
    busy={ai.busy}
    error={ai.error}
    requested={ai.requested}
    onRequestAi={ai.request}
  />
);

/** The five sections of a plan, each wired to the planner actions it can raise. */
export function planTabs(input: PlanTabsInput): TabDefinition[] {
  return [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewPanel plan={input.plan} progress={input.progress} />,
    },
    { id: 'budget', label: 'Budget', content: budgetContent(input) },
    { id: 'timeline', label: 'Timeline', content: timelineContent(input) },
    { id: 'vendors', label: 'Vendors', content: vendorsContent(input) },
    { id: 'ideas', label: 'Ideas', content: ideasContent(input) },
  ];
}

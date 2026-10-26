import { buildPlan, summarizeProgress } from '@utsav/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoViolations } from '../../test-utils/axe.js';
import { brief, TODAY } from '../../test-utils/fixtures.js';
import { AiIdeasSection } from './AiIdeasSection.js';
import { BudgetPanel } from './BudgetPanel.js';
import { OverviewPanel } from './OverviewPanel.js';
import { TimelinePanel } from './TimelinePanel.js';
import { VendorsPanel } from './VendorsPanel.js';

const plan = buildPlan(brief, TODAY);
const LATER = '2026-12-31';

describe('OverviewPanel', () => {
  it('explains a budget gap with both remedies', async () => {
    const lean = buildPlan({ ...brief, totalBudget: 300_000 }, TODAY);
    const progress = summarizeProgress(
      lean.tasks,
      lean.vendors,
      { done: new Set(), vendorStatus: {} },
      LATER,
    );
    const { container } = render(<OverviewPanel plan={lean} progress={progress} />);
    expect(screen.getAllByText('Budget gap')).not.toHaveLength(0);
    expect(screen.getAllByText(/Either invite about \d+ guests/).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Overdue' }).parentElement).not.toHaveTextContent(
      'Nothing overdue',
    );
    await expectNoViolations(container);
  });

  it('says when every task is done', () => {
    const done = new Set(plan.tasks.map((task) => task.id));
    render(
      <OverviewPanel
        plan={plan}
        progress={summarizeProgress(plan.tasks, plan.vendors, { done, vendorStatus: {} }, TODAY)}
      />,
    );
    expect(screen.getByText('Every task is done.')).toBeInTheDocument();
  });
});

describe('BudgetPanel', () => {
  it('reports overspend no headroom can cover, and ignores unchanged boxes', async () => {
    const onSpent = vi.fn();
    const user = userEvent.setup();
    const all = Object.fromEntries(
      plan.budget.lines.map((line) => [line.categoryId, line.amount * 2]),
    );
    render(<BudgetPanel plan={plan} spent={all} onSpent={onSpent} />);
    expect(screen.getByText(/cannot be covered from what is left/)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Spent so far on Venue'));
    await user.tab();
    expect(onSpent).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('Spent so far on Venue'));
    await user.tab();
    expect(onSpent).toHaveBeenCalledWith('venue', 0);
  });
});

describe('TimelinePanel and VendorsPanel', () => {
  it('flag overdue work when the host returns later', () => {
    render(<TimelinePanel tasks={plan.tasks} done={new Set()} today={LATER} onToggle={vi.fn()} />);
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
  });

  it('show booked and overdue vendors and the questions to ask', async () => {
    const onStatus = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <VendorsPanel
        vendors={plan.vendors}
        status={{ 'w-v-venue': 'booked' }}
        today={LATER}
        onStatus={onStatus}
      />,
    );
    expect(screen.getAllByText('Booked').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Booking overdue').length).toBeGreaterThan(0);
    await user.selectOptions(
      screen.getByLabelText('Status', { selector: '#vendor-w-v-caterer' }),
      'quoted',
    );
    expect(onStatus).toHaveBeenCalledWith('w-v-caterer', 'quoted');
    await expectNoViolations(container);
  });
});

describe('AiIdeasSection', () => {
  it('explains an empty result and shows errors', () => {
    const { rerender } = render(
      <AiIdeasSection aiIdeas={[]} busy={false} error={null} requested onRequestAi={vi.fn()} />,
    );
    expect(screen.getByText(/No new ideas passed the budget checks/)).toBeInTheDocument();
    rerender(
      <AiIdeasSection
        aiIdeas={[]}
        busy={false}
        error="The AI assistant is busy."
        requested
        onRequestAi={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('busy');
    rerender(<AiIdeasSection aiIdeas={[]} busy error={null} requested onRequestAi={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Thinking up ideas…' })).toBeDisabled();
  });
});

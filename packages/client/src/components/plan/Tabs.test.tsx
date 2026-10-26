import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoViolations } from '../../test-utils/axe.js';
import { Tabs } from './Tabs.js';

const TABS = [
  { id: 'a', label: 'Alpha', content: <p>Alpha panel</p> },
  { id: 'b', label: 'Beta', content: <p>Beta panel</p> },
  { id: 'c', label: 'Gamma', content: <p>Gamma panel</p> },
];

function Harness() {
  const [active, setActive] = useState('a');
  return <Tabs label="Sections" tabs={TABS} active={active} onSelect={setActive} />;
}

describe('Tabs', () => {
  it('follows the WAI-ARIA tabs keyboard pattern', async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await expectNoViolations(container);
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1');
    await user.click(alpha);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Beta' })).toHaveTextContent('Beta panel');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('x');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });

  it('keeps inactive panels in the document, hidden, so printing shows everything', () => {
    render(<Harness />);
    expect(screen.getByText('Gamma panel').closest('[role="tabpanel"]')).toHaveAttribute('hidden');
  });
});

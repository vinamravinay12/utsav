import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoViolations } from '../../test-utils/axe.js';
import { TODAY } from '../../test-utils/fixtures.js';
import { BriefForm } from './BriefForm.js';

const renderForm = (initial: Record<string, unknown> = {}) => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <BriefForm
      initial={initial}
      missing={[]}
      today={TODAY}
      editing={false}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { ...view, onSubmit, onCancel };
};

describe('BriefForm', () => {
  it('builds a complete brief from scratch through every control', async () => {
    const user = userEvent.setup();
    const { onSubmit, container } = renderForm();
    await user.click(screen.getByRole('radio', { name: 'Birthday' }));
    await user.type(screen.getByLabelText('Event name (optional)'), 'Kabir turns 7');
    await user.type(screen.getByLabelText('Date'), '2026-11-08');
    await user.type(screen.getByLabelText('Number of guests'), '25');
    await user.type(screen.getByLabelText('Total budget (₹)'), '25,000');
    await user.type(screen.getByLabelText('City or town'), 'Pune');
    await user.selectOptions(screen.getByLabelText('Who are the guests?'), 'kids');
    await user.click(screen.getByRole('radio', { name: 'Outdoor' }));
    await user.click(screen.getByRole('radio', { name: 'Modern' }));
    await user.click(screen.getByRole('checkbox', { name: 'Cake & desserts' }));
    await user.click(screen.getByRole('checkbox', { name: 'Games' }));
    await user.click(screen.getByRole('checkbox', { name: 'Music' }));
    await user.click(screen.getByRole('checkbox', { name: 'Music' }));
    await user.click(screen.getByRole('checkbox', { name: 'Nut-free' }));
    await expectNoViolations(container);
    await user.click(screen.getByRole('button', { name: 'Build my plan' }));
    expect(onSubmit).toHaveBeenCalledWith({
      eventType: 'birthday',
      name: 'Kabir turns 7',
      eventDate: '2026-11-08',
      guestCount: 25,
      totalBudget: 25_000,
      city: 'Pune',
      setting: 'outdoor',
      style: 'modern',
      ageGroup: 'kids',
      priorities: ['cake'],
      interests: ['games'],
      dietary: ['nut-free'],
    });
  });

  it('caps priorities at three and clears them when the event type changes', async () => {
    const user = userEvent.setup();
    renderForm({ eventType: 'wedding' });
    for (const name of ['Venue', 'Catering', 'Photo & video']) {
      await user.click(screen.getByRole('checkbox', { name }));
    }
    expect(screen.getByRole('checkbox', { name: 'Attire & beauty' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Community event' }));
    expect(
      screen.getByRole('checkbox', { name: 'Safety, first aid & insurance' }),
    ).not.toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'Venue' })).not.toBeInTheDocument();
  });

  it('marks invalid fields and links each error to its field', async () => {
    const user = userEvent.setup();
    renderForm({
      eventType: 'wedding',
      eventDate: '2026-01-01',
      guestCount: 10,
      totalBudget: 100_000,
      city: 'Pune',
      setting: 'indoor',
      style: 'modern',
      ageGroup: 'adults',
    });
    await user.click(screen.getByRole('button', { name: 'Build my plan' }));
    const date = screen.getByLabelText('Date');
    expect(date).toHaveAttribute('aria-invalid', 'true');
    expect(date).toHaveAccessibleDescription('The event date has already passed.');
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix one field');
  });

  it('cancels', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Start again' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

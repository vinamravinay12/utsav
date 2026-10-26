import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle.js';
import { expectNoViolations } from '../../test-utils/axe.js';

describe('ThemeToggle', () => {
  it('offers light, system and dark', () => {
    render(<ThemeToggle preference="system" onChange={vi.fn()} />);
    for (const label of ['Light', 'System', 'Dark']) {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
    }
  });

  it('announces which one is active', () => {
    render(<ThemeToggle preference="dark" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
  });

  it('is grouped so a screen reader reads it as one control', () => {
    render(<ThemeToggle preference="system" onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Colour theme' })).toBeInTheDocument();
  });

  it('reports the chosen preference', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle preference="system" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('keeps "system" available, which a two-state switch could not express', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle preference="dark" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'System' }));
    expect(onChange).toHaveBeenCalledWith('system');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ThemeToggle preference="system" onChange={vi.fn()} />);
    await expectNoViolations(container);
  });
});

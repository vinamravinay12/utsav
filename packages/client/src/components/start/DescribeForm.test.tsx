import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DescribeForm } from './DescribeForm.js';

describe('DescribeForm', () => {
  it('does not submit a description that is too short, however the form is submitted', () => {
    const onSubmit = vi.fn();
    const { container } = render(<DescribeForm busy={false} error={null} onSubmit={onSubmit} />);
    const form = container.querySelector('form');
    if (form === null) {
      throw new Error('form missing');
    }
    fireEvent.submit(form);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Plan my event' })).toBeDisabled();
  });

  it('shows progress while reading', () => {
    render(<DescribeForm busy error={null} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Reading your description…' })).toBeDisabled();
  });
});

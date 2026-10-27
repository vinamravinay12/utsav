import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';
import { STORAGE_KEY } from './state/saved-plan.js';
import { START_AFRESH_PROMPT } from './state/use-start-afresh.js';
import { brief, savedPlan, storePlan, stubFetch, TODAY } from './test-utils/fixtures.js';

const logo = () => screen.getByRole('link', { name: /Utsav/ });

describe('starting afresh', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns from a saved plan to an empty home page via the logo, after confirming', async () => {
    storePlan(savedPlan({ done: ['w-budget'] }));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<App today={TODAY} />);
    expect(await screen.findByRole('heading', { name: brief.name })).toBeInTheDocument();

    await user.click(logo());

    expect(confirm).toHaveBeenCalledWith(START_AFRESH_PROMPT);
    expect(screen.getByLabelText('Describe your event')).toHaveValue('');
    expect(screen.queryByRole('heading', { name: brief.name })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  it('keeps the plan when the host cancels', async () => {
    storePlan(savedPlan());
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<App today={TODAY} />);
    await screen.findByRole('heading', { name: brief.name });
    await user.click(logo());
    expect(screen.getByRole('heading', { name: brief.name })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('clears a half-filled form without asking when there is no plan yet', async () => {
    const confirm = vi.spyOn(window, 'confirm');
    const user = userEvent.setup();
    render(<App today={TODAY} />);
    await user.click(screen.getByRole('button', { name: 'Fill in the details yourself' }));
    await user.type(screen.getByLabelText('City or town'), 'Pune');
    await user.click(screen.getByRole('button', { name: 'Start afresh' }));
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Plan my event' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fill in the details yourself' }));
    expect(screen.getByLabelText('City or town')).toHaveValue('');
  });

  it('clears typed text and an error message on the home page itself', async () => {
    vi.stubGlobal(
      'fetch',
      stubFetch({ '/api/extract': { status: 503, body: { error: 'The AI assistant is busy.' } } }),
    );
    const user = userEvent.setup();
    render(<App today={TODAY} />);
    await user.type(
      screen.getByLabelText('Describe your event'),
      'A wedding for 200 guests in Jaipur',
    );
    await user.click(screen.getByRole('button', { name: 'Plan my event' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('busy');

    await user.click(screen.getByRole('button', { name: 'Start afresh' }));

    expect(screen.getByLabelText('Describe your event')).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('ignores an AI reply that arrives after starting afresh', async () => {
    let answer: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      () =>
        new Promise<Response>((resolve) => {
          answer = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<App today={TODAY} />);
    await user.type(
      screen.getByLabelText('Describe your event'),
      'A wedding for 200 guests in Jaipur',
    );
    await user.click(screen.getByRole('button', { name: 'Plan my event' }));
    expect(screen.getByRole('button', { name: 'Reading your description…' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Start afresh' }));
    answer(
      new Response(JSON.stringify({ draft: { eventType: 'wedding' }, missing: [], today: TODAY }), {
        status: 200,
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Plan my event' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Check the details' })).not.toBeInTheDocument();
  });

  it('leaves modified clicks on the logo to the browser', async () => {
    storePlan(savedPlan());
    const confirm = vi.spyOn(window, 'confirm');
    const user = userEvent.setup();
    render(<App today={TODAY} />);
    await screen.findByRole('heading', { name: brief.name });
    await user.keyboard('{Control>}');
    await user.click(logo());
    await user.keyboard('{/Control}');
    expect(confirm).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: brief.name })).toBeInTheDocument();
  });
});

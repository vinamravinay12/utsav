import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { messageOf } from '../api/types.js';
import { brief, stubFetch, TODAY } from '../test-utils/fixtures.js';
import { useAiIdeas } from './use-ai-ideas.js';
import { useExtract } from './use-extract.js';

describe('request hooks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('report a failed AI ideas request', async () => {
    vi.stubGlobal(
      'fetch',
      stubFetch({ '/api/ideas': { status: 503, body: { error: 'Busy right now.' } } }),
    );
    const onIdeas = vi.fn();
    const { result } = renderHook(() => useAiIdeas(brief, TODAY, onIdeas));
    act(() => {
      result.current.request();
    });
    await waitFor(() => {
      expect(result.current.error).toBe('Busy right now.');
    });
    expect(result.current).toMatchObject({ busy: false, requested: true });
    expect(onIdeas).not.toHaveBeenCalled();
  });

  it('report a failed extraction', async () => {
    vi.stubGlobal('fetch', stubFetch({}));
    const dispatch = vi.fn();
    const { result } = renderHook(() => useExtract(TODAY, dispatch));
    act(() => {
      result.current.describe('A wedding in Jaipur for 200');
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/could not reach/);
    });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('drop the error of a request that failed after a reset', async () => {
    let fail: (reason: Error) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      () =>
        new Promise<Response>((_resolve, reject) => {
          fail = reject;
        }),
    );
    const { result } = renderHook(() => useExtract(TODAY, vi.fn()));
    act(() => {
      result.current.describe('A wedding in Jaipur for 200');
    });
    act(() => {
      result.current.clear();
    });
    await act(async () => {
      fail(new TypeError('offline'));
      await Promise.resolve();
    });
    expect(result.current).toMatchObject({ busy: false, error: null });
  });

  it('fall back to a generic message for a non-Error failure', () => {
    expect(messageOf('weird')).toBe('Something went wrong. Please try again.');
    expect(messageOf(new Error('Specific'))).toBe('Specific');
  });
});

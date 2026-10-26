import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiIdea, brief, stubFetch, TODAY } from '../test-utils/fixtures.js';
import { extractBrief, fetchAiIdeas } from './client.js';
import { ApiError } from './types.js';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the description and returns the draft', async () => {
    const fetch = vi.fn(
      stubFetch({
        '/api/extract': { body: { draft: { eventType: 'wedding' }, missing: [], today: TODAY } },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    await expect(extractBrief('A wedding for 200', TODAY)).resolves.toMatchObject({
      draft: { eventType: 'wedding' },
    });
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ description: 'A wedding for 200', today: TODAY }),
    });
  });

  it('returns AI ideas', async () => {
    vi.stubGlobal('fetch', stubFetch({ '/api/ideas': { body: { ideas: [aiIdea] } } }));
    await expect(fetchAiIdeas(brief, TODAY)).resolves.toEqual([aiIdea]);
  });

  it('shows the server’s own message for an error', async () => {
    vi.stubGlobal(
      'fetch',
      stubFetch({
        '/api/extract': { status: 422, body: { error: 'That reads like instructions.' } },
      }),
    );
    await expect(extractBrief('x', TODAY)).rejects.toThrow('That reads like instructions.');
  });

  it('falls back to a generic message for an unreadable error body', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('<html>', { status: 502 })));
    await expect(extractBrief('x', TODAY)).rejects.toThrow('Something went wrong');
    vi.stubGlobal('fetch', stubFetch({ '/api/extract': { status: 500, body: { error: 42 } } }));
    await expect(extractBrief('x', TODAY)).rejects.toThrow('Something went wrong');
  });

  it('explains a network failure', async () => {
    vi.stubGlobal('fetch', stubFetch({}));
    const failure = extractBrief('x', TODAY);
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toThrow('could not reach Utsav');
  });
});

import type { EventBrief } from '@utsav/core';
import { ApiError, type AiIdea, type ExtractResponse } from './types.js';

const FALLBACK = 'Something went wrong. Please try again, or fill in the form yourself.';

/** The server's error text is written for people; anything else gets a safe generic line. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === 'string' ? body.error : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('We could not reach Utsav. Check your connection and try again.');
  }
  if (!response.ok) {
    throw new ApiError(await errorMessage(response));
  }
  return (await response.json()) as T;
}

export function extractBrief(description: string, today: string): Promise<ExtractResponse> {
  return postJson<ExtractResponse>('/api/extract', { description, today });
}

export async function fetchAiIdeas(brief: EventBrief, today: string): Promise<readonly AiIdea[]> {
  const { ideas } = await postJson<{ ideas: readonly AiIdea[] }>('/api/ideas', { brief, today });
  return ideas;
}

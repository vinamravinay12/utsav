import type { EventBrief } from '@utsav/core';
import { useCallback, useState } from 'react';
import { fetchAiIdeas } from '../api/client.js';
import { messageOf, type AiIdea } from '../api/types.js';

export interface AiIdeasRequest {
  readonly busy: boolean;
  readonly error: string | null;
  readonly requested: boolean;
  readonly request: () => void;
}

/** One request at a time; results are handed to the planner so they persist with the plan. */
export function useAiIdeas(
  brief: EventBrief,
  today: string,
  onIdeas: (ideas: readonly AiIdea[]) => void,
): AiIdeasRequest {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const request = useCallback(() => {
    setBusy(true);
    setError(null);
    setRequested(true);
    fetchAiIdeas(brief, today)
      .then(onIdeas)
      .catch((cause: unknown) => {
        setError(messageOf(cause));
      })
      .finally(() => {
        setBusy(false);
      });
  }, [brief, today, onIdeas]);
  return { busy, error, requested, request };
}

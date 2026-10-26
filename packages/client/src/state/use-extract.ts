import { useCallback, useState } from 'react';
import { extractBrief } from '../api/client.js';
import { messageOf } from '../api/types.js';
import type { PlannerAction } from './planner-reducer.js';

export interface Extraction {
  readonly busy: boolean;
  readonly error: string | null;
  readonly describe: (description: string) => void;
}

/** Sends the description to the AI reader and moves the planner to review with what it found. */
export function useExtract(today: string, dispatch: (action: PlannerAction) => void): Extraction {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const describe = useCallback(
    (description: string) => {
      setBusy(true);
      setError(null);
      extractBrief(description, today)
        .then(({ draft, missing }) => {
          dispatch({ type: 'drafted', draft, missing });
        })
        .catch((cause: unknown) => {
          setError(messageOf(cause));
        })
        .finally(() => {
          setBusy(false);
        });
    },
    [today, dispatch],
  );
  return { busy, error, describe };
}

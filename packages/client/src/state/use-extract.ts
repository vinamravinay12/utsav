import { useCallback, useRef, useState } from 'react';
import { extractBrief } from '../api/client.js';
import { messageOf } from '../api/types.js';
import type { PlannerAction } from './planner-reducer.js';

export interface Extraction {
  readonly busy: boolean;
  readonly error: string | null;
  readonly describe: (description: string) => void;
  /** Forgets any error and drops a reply still in flight. */
  readonly clear: () => void;
}

/** Sends the description to the AI reader and moves the planner to review with what it found. */
export function useExtract(today: string, dispatch: (action: PlannerAction) => void): Extraction {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Each request takes a number; a reply only counts if nothing newer — a later
  // request or a reset — has happened since. Otherwise a slow answer could pull
  // the host back to the review screen after they had started afresh.
  const latest = useRef(0);
  const describe = useCallback(
    (description: string) => {
      latest.current += 1;
      const request = latest.current;
      const current = (): boolean => request === latest.current;
      setBusy(true);
      setError(null);
      extractBrief(description, today)
        .then(({ draft, missing }) => {
          if (current()) {
            dispatch({ type: 'drafted', draft, missing });
          }
        })
        .catch((cause: unknown) => {
          if (current()) {
            setError(messageOf(cause));
          }
        })
        .finally(() => {
          if (current()) {
            setBusy(false);
          }
        });
    },
    [today, dispatch],
  );
  const clear = useCallback(() => {
    latest.current += 1;
    setBusy(false);
    setError(null);
  }, []);
  return { busy, error, describe, clear };
}

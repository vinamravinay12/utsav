import { useCallback, useState } from 'react';
import type { PlannerAction } from './planner-reducer.js';

export const START_AFRESH_PROMPT =
  'Start afresh? This clears your current plan and all its progress from this browser.';

interface StartAfreshOptions {
  readonly hasPlan: boolean;
  readonly dispatch: (action: PlannerAction) => void;
  readonly clearExtraction: () => void;
}

export interface StartAfresh {
  /** Changes on every reset; keying the start screen on it clears typed text. */
  readonly session: number;
  readonly startAfresh: () => void;
}

/**
 * The one way back to an empty home page, used by the header button and the
 * logo. A saved plan holds weeks of progress, so that case asks first; a
 * half-filled form or a typed description is cleared without asking.
 */
export function useStartAfresh({
  hasPlan,
  dispatch,
  clearExtraction,
}: StartAfreshOptions): StartAfresh {
  const [session, setSession] = useState(0);
  const startAfresh = useCallback(() => {
    if (hasPlan && !window.confirm(START_AFRESH_PROMPT)) {
      return;
    }
    clearExtraction();
    dispatch({ type: 'reset' });
    setSession((value) => value + 1);
  }, [hasPlan, dispatch, clearExtraction]);
  return { session, startAfresh };
}

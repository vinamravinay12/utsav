import { useEffect, useReducer } from 'react';
import {
  initialState,
  plannerReducer,
  type PlannerAction,
  type PlannerState,
} from './planner-reducer.js';
import { loadSavedPlan, storeSavedPlan } from './saved-plan.js';

/**
 * Planner state, restored from and persisted to this browser.
 *
 * Every change to the plan or its progress is written straight back, so a
 * refresh, a closed tab or a return visit weeks later picks up where the host
 * left off. Nothing leaves the device.
 */
export function usePlanner(): readonly [PlannerState, (action: PlannerAction) => void] {
  const [state, dispatch] = useReducer(plannerReducer, null, () => initialState(loadSavedPlan()));
  useEffect(() => {
    storeSavedPlan(state.saved);
  }, [state.saved]);
  return [state, dispatch];
}

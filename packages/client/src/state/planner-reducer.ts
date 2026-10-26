import type { BriefIssue, EventBrief, VendorStatus } from '@utsav/core';
import type { AiIdea } from '../api/types.js';
import { STORAGE_VERSION, type SavedPlan } from './saved-plan.js';

export type Stage = 'start' | 'review' | 'plan';

export interface PlannerState {
  readonly stage: Stage;
  /** Form state while reviewing: whatever the AI read, plus the host's edits. */
  readonly draft: Readonly<Record<string, unknown>>;
  /** Questions the AI could not answer from the description. */
  readonly missing: readonly BriefIssue[];
  readonly saved: SavedPlan | null;
}

export type PlannerAction =
  | {
      readonly type: 'drafted';
      readonly draft: Readonly<Record<string, unknown>>;
      readonly missing: readonly BriefIssue[];
    }
  | { readonly type: 'start-manual' }
  | { readonly type: 'planned'; readonly brief: EventBrief; readonly plannedOn: string }
  | { readonly type: 'edit-brief' }
  | { readonly type: 'cancel-edit' }
  | { readonly type: 'toggle-task'; readonly taskId: string }
  | { readonly type: 'vendor-status'; readonly vendorId: string; readonly status: VendorStatus }
  | { readonly type: 'spent'; readonly categoryId: string; readonly amount: number }
  | { readonly type: 'ai-ideas'; readonly ideas: readonly AiIdea[] }
  | { readonly type: 'reset' };

export const initialState = (saved: SavedPlan | null): PlannerState => ({
  stage: saved === null ? 'start' : 'plan',
  draft: {},
  missing: [],
  saved,
});

/**
 * Re-planning after an edit keeps the host's progress where it still means
 * something: ticked tasks and vendor statuses carry over by id, spending by
 * category. Changing the event type changes every id, so progress resets.
 */
function replan(previous: SavedPlan | null, brief: EventBrief, plannedOn: string): SavedPlan {
  const keep = previous !== null && previous.brief.eventType === brief.eventType;
  return {
    version: STORAGE_VERSION,
    brief,
    plannedOn: keep ? previous.plannedOn : plannedOn,
    done: keep ? previous.done : [],
    vendorStatus: keep ? previous.vendorStatus : {},
    spent: keep ? previous.spent : {},
    aiIdeas: [],
  };
}

function updateSaved(state: PlannerState, update: (saved: SavedPlan) => SavedPlan): PlannerState {
  return state.saved === null ? state : { ...state, saved: update(state.saved) };
}

type Handler<T extends PlannerAction['type']> = (
  state: PlannerState,
  action: Extract<PlannerAction, { type: T }>,
) => PlannerState;

const toggle = (ids: readonly string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];

/** One small handler per action, so each transition reads and tests on its own. */
const HANDLERS: { readonly [T in PlannerAction['type']]: Handler<T> } = {
  drafted: (state, { draft, missing }) => ({ ...state, stage: 'review', draft, missing }),
  'start-manual': (state) => ({ ...state, stage: 'review', draft: {}, missing: [] }),
  planned: (state, { brief, plannedOn }) => ({
    ...state,
    stage: 'plan',
    draft: {},
    missing: [],
    saved: replan(state.saved, brief, plannedOn),
  }),
  'edit-brief': (state) =>
    state.saved === null
      ? state
      : { ...state, stage: 'review', draft: { ...state.saved.brief }, missing: [] },
  'cancel-edit': (state) => ({
    ...state,
    stage: state.saved === null ? 'start' : 'plan',
    draft: {},
    missing: [],
  }),
  'toggle-task': (state, { taskId }) =>
    updateSaved(state, (saved) => ({ ...saved, done: toggle(saved.done, taskId) })),
  'vendor-status': (state, { vendorId, status }) =>
    updateSaved(state, (saved) => ({
      ...saved,
      vendorStatus: { ...saved.vendorStatus, [vendorId]: status },
    })),
  spent: (state, { categoryId, amount }) =>
    updateSaved(state, (saved) => ({ ...saved, spent: { ...saved.spent, [categoryId]: amount } })),
  'ai-ideas': (state, { ideas }) => updateSaved(state, (saved) => ({ ...saved, aiIdeas: ideas })),
  reset: () => initialState(null),
};

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  // TypeScript cannot correlate the handler with its action through the index.
  const handler = HANDLERS[action.type] as Handler<PlannerAction['type']>;
  return handler(state, action);
}

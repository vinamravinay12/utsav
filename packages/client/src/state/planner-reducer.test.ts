import { describe, expect, it } from 'vitest';
import { aiIdea, brief, savedPlan, TODAY } from '../test-utils/fixtures.js';
import { initialState, plannerReducer, type PlannerState } from './planner-reducer.js';

const planned: PlannerState = { stage: 'plan', draft: {}, missing: [], saved: savedPlan() };

describe('plannerReducer', () => {
  it('starts at the plan when one is saved, otherwise at the start', () => {
    expect(initialState(null).stage).toBe('start');
    expect(initialState(savedPlan()).stage).toBe('plan');
  });

  it('moves to review with what the AI read, or with an empty form', () => {
    const missing = [{ field: 'city' as const, message: 'Which city?' }];
    expect(
      plannerReducer(initialState(null), {
        type: 'drafted',
        draft: { eventType: 'birthday' },
        missing,
      }),
    ).toEqual({
      stage: 'review',
      draft: { eventType: 'birthday' },
      missing,
      saved: null,
    });
    expect(plannerReducer(initialState(null), { type: 'start-manual' }).stage).toBe('review');
  });

  it('creates a plan, and keeps progress when the same event is edited', () => {
    const fresh = plannerReducer(initialState(null), { type: 'planned', brief, plannedOn: TODAY });
    expect(fresh.saved).toEqual(savedPlan());
    const progressed: PlannerState = {
      ...planned,
      saved: savedPlan({
        done: ['w-budget'],
        spent: { venue: 10 },
        vendorStatus: { x: 'booked' },
        aiIdeas: [aiIdea],
      }),
    };
    const edited = plannerReducer(progressed, {
      type: 'planned',
      brief: { ...brief, guestCount: 300 },
      plannedOn: '2026-11-01',
    });
    expect(edited.saved).toMatchObject({
      plannedOn: TODAY,
      done: ['w-budget'],
      spent: { venue: 10 },
      aiIdeas: [],
    });
    const retyped = plannerReducer(progressed, {
      type: 'planned',
      brief: { ...brief, eventType: 'birthday', priorities: [] },
      plannedOn: '2026-11-01',
    });
    expect(retyped.saved).toMatchObject({
      plannedOn: '2026-11-01',
      done: [],
      spent: {},
      vendorStatus: {},
    });
  });

  it('opens the saved brief for editing and cancels back', () => {
    const editing = plannerReducer(planned, { type: 'edit-brief' });
    expect(editing).toMatchObject({ stage: 'review', draft: brief });
    expect(plannerReducer(editing, { type: 'cancel-edit' }).stage).toBe('plan');
    expect(plannerReducer(initialState(null), { type: 'edit-brief' })).toEqual(initialState(null));
    expect(
      plannerReducer({ ...initialState(null), stage: 'review' }, { type: 'cancel-edit' }).stage,
    ).toBe('start');
  });

  it('tracks tasks, vendors, spending and AI ideas', () => {
    let state = plannerReducer(planned, { type: 'toggle-task', taskId: 'w-budget' });
    expect(state.saved?.done).toEqual(['w-budget']);
    state = plannerReducer(state, { type: 'toggle-task', taskId: 'w-budget' });
    expect(state.saved?.done).toEqual([]);
    state = plannerReducer(state, {
      type: 'vendor-status',
      vendorId: 'w-v-venue',
      status: 'quoted',
    });
    state = plannerReducer(state, { type: 'spent', categoryId: 'venue', amount: 5000 });
    state = plannerReducer(state, { type: 'ai-ideas', ideas: [aiIdea] });
    expect(state.saved).toMatchObject({
      vendorStatus: { 'w-v-venue': 'quoted' },
      spent: { venue: 5000 },
      aiIdeas: [aiIdea],
    });
  });

  it('ignores progress actions when there is no plan, and resets', () => {
    const empty = initialState(null);
    expect(plannerReducer(empty, { type: 'toggle-task', taskId: 'x' })).toBe(empty);
    expect(plannerReducer(planned, { type: 'reset' })).toEqual(initialState(null));
  });
});

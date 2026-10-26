import { VENDOR_STATUSES, completeBrief, type EventBrief, type VendorStatus } from '@utsav/core';
import type { AiIdea } from '../api/types.js';

/** Bumped whenever the stored shape changes; older versions are discarded, not guessed at. */
export const STORAGE_VERSION = 1;
export const STORAGE_KEY = 'utsav-plan';

export interface SavedPlan {
  readonly version: typeof STORAGE_VERSION;
  readonly brief: EventBrief;
  readonly plannedOn: string;
  readonly done: readonly string[];
  readonly vendorStatus: Readonly<Record<string, VendorStatus>>;
  readonly spent: Readonly<Record<string, number>>;
  readonly aiIdeas: readonly AiIdea[];
}

type Raw = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const MAX_SPEND = 10_000_000_000;

function entriesOf<T>(value: unknown, keep: (entry: unknown) => entry is T): Record<string, T> {
  return isRecord(value)
    ? Object.fromEntries(Object.entries(value).filter((pair): pair is [string, T] => keep(pair[1])))
    : {};
}

const isStatus = (value: unknown): value is VendorStatus =>
  VENDOR_STATUSES.includes(value as VendorStatus);

const isSpend = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_SPEND;

function isAiIdea(value: unknown): value is AiIdea {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.categoryId === 'string' &&
    typeof value.categoryLabel === 'string' &&
    typeof value.estimatedCost === 'number' &&
    typeof value.shareOfCategory === 'number'
  );
}

/**
 * Restores a saved plan, treating storage as untrusted: another tab, an old
 * version or a hand-edited value must never crash the app or reach the engine
 * unchecked. The brief goes back through the engine's own validator.
 */
export function parseSavedPlan(value: unknown): SavedPlan | null {
  if (
    !isRecord(value) ||
    value.version !== STORAGE_VERSION ||
    typeof value.plannedOn !== 'string'
  ) {
    return null;
  }
  const brief = isRecord(value.brief) ? completeBrief(value.brief, value.plannedOn) : null;
  if (!brief?.ok) {
    return null;
  }
  return {
    version: STORAGE_VERSION,
    brief: brief.brief,
    plannedOn: value.plannedOn,
    done: Array.isArray(value.done)
      ? value.done.filter((id): id is string => typeof id === 'string')
      : [],
    vendorStatus: entriesOf(value.vendorStatus, isStatus),
    spent: entriesOf(value.spent, isSpend),
    aiIdeas: Array.isArray(value.aiIdeas) ? value.aiIdeas.filter(isAiIdea) : [],
  };
}

/** Storage can throw outright in a private window or with site data blocked. */
export function loadSavedPlan(storage: Pick<Storage, 'getItem'> = localStorage): SavedPlan | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? null : parseSavedPlan(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function storeSavedPlan(
  plan: SavedPlan | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = localStorage,
): void {
  try {
    if (plan === null) {
      storage.removeItem(STORAGE_KEY);
    } else {
      storage.setItem(STORAGE_KEY, JSON.stringify(plan));
    }
  } catch {
    // A plan we cannot store still works for this visit; nothing to surface.
  }
}

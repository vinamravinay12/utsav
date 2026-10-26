import { describe, expect, it } from 'vitest';
import { buildPlan } from '../plan/build-plan.js';
import { PLANNED_ON, weddingBrief } from '../test-utils/briefs.js';
import { summarizeProgress } from './summarize-progress.js';

const plan = buildPlan(weddingBrief, PLANNED_ON);

describe('summarizeProgress', () => {
  it('starts at zero with the earliest tasks up next', () => {
    const summary = summarizeProgress(
      plan.tasks,
      plan.vendors,
      { done: new Set(), vendorStatus: {} },
      PLANNED_ON,
    );
    expect(summary.tasksDone).toBe(0);
    expect(summary.readiness).toBe(0);
    expect(summary.upNext.map((task) => task.id)).toEqual(['w-budget', 'w-guestlist', 'w-date']);
    expect(summary.overdueTasks).toEqual([]);
    expect(summary.essentialRemaining).toBe(plan.tasks.filter((task) => task.essential).length);
  });

  it('weights tasks at 60% and vendor bookings at 40%', () => {
    const done = new Set(plan.tasks.map((task) => task.id));
    const vendorStatus = Object.fromEntries(
      plan.vendors.map((vendor) => [vendor.id, 'booked' as const]),
    );
    expect(
      summarizeProgress(plan.tasks, plan.vendors, { done, vendorStatus: {} }, PLANNED_ON).readiness,
    ).toBe(60);
    expect(
      summarizeProgress(plan.tasks, plan.vendors, { done: new Set(), vendorStatus }, PLANNED_ON)
        .readiness,
    ).toBe(40);
    expect(
      summarizeProgress(plan.tasks, plan.vendors, { done, vendorStatus }, PLANNED_ON).readiness,
    ).toBe(100);
  });

  it('flags overdue tasks and unbooked vendors when the host comes back later', () => {
    const later = '2026-12-01';
    const summary = summarizeProgress(
      plan.tasks,
      plan.vendors,
      {
        done: new Set(['w-budget']),
        vendorStatus: { 'w-v-venue': 'booked', 'w-v-caterer': 'quoted' },
      },
      later,
    );
    expect(summary.overdueTasks.map((task) => task.id)).not.toContain('w-budget');
    expect(summary.overdueTasks.map((task) => task.id)).toContain('w-guestlist');
    expect(summary.overdueVendors.map((vendor) => vendor.id)).not.toContain('w-v-venue');
    expect(summary.overdueVendors.map((vendor) => vendor.id)).toContain('w-v-caterer');
    expect(summary.upNext.every((task) => task.dueDate >= later)).toBe(true);
  });

  it('treats an empty list as complete rather than dividing by zero', () => {
    expect(
      summarizeProgress([], [], { done: new Set(), vendorStatus: {} }, PLANNED_ON).readiness,
    ).toBe(100);
  });
});

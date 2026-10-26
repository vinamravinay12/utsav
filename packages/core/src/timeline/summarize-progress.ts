import type { ScheduledTask, VendorItem } from '../types/index.js';

export type VendorStatus = 'todo' | 'contacted' | 'quoted' | 'booked';

export const VENDOR_STATUSES: readonly VendorStatus[] = ['todo', 'contacted', 'quoted', 'booked'];

export interface ProgressSummary {
  readonly tasksDone: number;
  readonly tasksTotal: number;
  readonly essentialRemaining: number;
  readonly vendorsBooked: number;
  readonly vendorsTotal: number;
  /** 0–100: task completion weighted 60%, vendor bookings 40%. */
  readonly readiness: number;
  readonly overdueTasks: readonly ScheduledTask[];
  readonly overdueVendors: readonly VendorItem[];
  readonly upNext: readonly ScheduledTask[];
}

const UP_NEXT_COUNT = 3;

const ratio = (part: number, whole: number): number => (whole === 0 ? 1 : part / whole);

/**
 * Where the plan stands today.
 *
 * The schedule was anchored to the day the plan was made; `today` is when the
 * host is looking at it. Anything due before today and not done is overdue.
 */
export interface ProgressState {
  readonly done: ReadonlySet<string>;
  readonly vendorStatus: Readonly<Record<string, VendorStatus>>;
}

export function summarizeProgress(
  tasks: readonly ScheduledTask[],
  vendors: readonly VendorItem[],
  { done, vendorStatus }: ProgressState,
  today: string,
): ProgressSummary {
  const pending = tasks.filter((task) => !done.has(task.id));
  const booked = vendors.filter((vendor) => vendorStatus[vendor.id] === 'booked');
  const taskRatio = ratio(tasks.length - pending.length, tasks.length);
  const vendorRatio = ratio(booked.length, vendors.length);
  return {
    tasksDone: tasks.length - pending.length,
    tasksTotal: tasks.length,
    essentialRemaining: pending.filter((task) => task.essential).length,
    vendorsBooked: booked.length,
    vendorsTotal: vendors.length,
    readiness: Math.round((taskRatio * 0.6 + vendorRatio * 0.4) * 100),
    overdueTasks: pending.filter((task) => task.dueDate < today),
    overdueVendors: vendors.filter(
      (vendor) => vendor.bookBy < today && vendorStatus[vendor.id] !== 'booked',
    ),
    upNext: pending.filter((task) => task.dueDate >= today).slice(0, UP_NEXT_COUNT),
  };
}

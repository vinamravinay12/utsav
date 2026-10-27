/**
 * Profiles the planning engine with real timings (run via `npm run profile`):
 *  - buildPlan latency percentiles for each sample brief
 *  - heap growth across many plans (to catch retention)
 *  - payload sizes the browser holds and the calendar export
 */
import { performance } from 'node:perf_hooks';
import { PLANNED_ON, percentile } from './lib/stats.mjs';
import { buildPlan, summarizeSpending, toICalendar } from '../packages/core/dist/index.js';

const BRIEFS = {
  wedding: {
    eventType: 'wedding',
    name: 'Asha & Rohan',
    eventDate: '2027-02-14',
    guestCount: 250,
    totalBudget: 1_800_000,
    city: 'Jaipur',
    setting: 'mixed',
    style: 'eco',
    ageGroup: 'all-ages',
    priorities: ['decor', 'photography'],
    interests: ['sustainability', 'food'],
    dietary: ['vegetarian', 'jain'],
  },
  birthday: {
    eventType: 'birthday',
    name: 'Kabir turns 7',
    eventDate: '2026-10-30',
    guestCount: 20,
    totalBudget: 15_000,
    city: 'Pune',
    setting: 'outdoor',
    style: 'modern',
    ageGroup: 'kids',
    priorities: [],
    interests: ['games'],
    dietary: ['nut-free'],
  },
  community: {
    eventType: 'community',
    name: 'Green Park fair',
    eventDate: '2027-07-18',
    guestCount: 400,
    totalBudget: 150_000,
    city: 'Bengaluru',
    setting: 'outdoor',
    style: 'eco',
    ageGroup: 'all-ages',
    priorities: ['safety'],
    interests: ['food', 'games', 'sustainability'],
    dietary: [],
  },
};

/** Latency percentiles and throughput of `operation`, after a JIT warm-up. */
function measure(operation, iterations) {
  for (let warmUp = 0; warmUp < 200; warmUp += 1) operation(); // warm the JIT
  const samples = [];
  for (let run = 0; run < iterations; run += 1) {
    const start = performance.now();
    operation();
    samples.push(performance.now() - start);
  }
  samples.sort((first, second) => first - second);
  const microseconds = (milliseconds) => `${(milliseconds * 1000).toFixed(1)} µs`;
  return {
    p50: microseconds(percentile(samples, 50)),
    p95: microseconds(percentile(samples, 95)),
    p99: microseconds(percentile(samples, 99)),
    opsPerSec: Math.round(
      (iterations / samples.reduce((total, sample) => total + sample, 0)) * 1000,
    ),
  };
}

/** Size of a string in kilobytes, as UTF-8 bytes. */
const kilobytes = (text) => `${(Buffer.byteLength(text) / 1024).toFixed(1)} KB`;

console.log('\n## Engine latency (10 000 runs each)\n');
console.log('| Brief | p50 | p95 | p99 | plans/sec |\n| :-- | --: | --: | --: | --: |');
for (const [name, brief] of Object.entries(BRIEFS)) {
  const planTiming = measure(() => buildPlan(brief, PLANNED_ON), 10_000);
  console.log(
    `| ${name} | ${planTiming.p50} | ${planTiming.p95} | ${planTiming.p99} | ${planTiming.opsPerSec.toLocaleString('en-IN')} |`,
  );
}
const plan = buildPlan(BRIEFS.wedding, PLANNED_ON);
const spend = measure(
  () => summarizeSpending(plan.budget.lines, { venue: 400_000, decor: 300_000 }),
  10_000,
);
const calendarTiming = measure(() => toICalendar(plan), 2_000);
console.log(
  `| spending summary | ${spend.p50} | ${spend.p95} | ${spend.p99} | ${spend.opsPerSec.toLocaleString('en-IN')} |`,
);
console.log(
  `| calendar export | ${calendarTiming.p50} | ${calendarTiming.p95} | ${calendarTiming.p99} | ${calendarTiming.opsPerSec.toLocaleString('en-IN')} |`,
);

console.log('\n## Memory\n');
globalThis.gc?.();
const before = process.memoryUsage().heapUsed;
for (let plan = 0; plan < 50_000; plan += 1)
  buildPlan(BRIEFS[['wedding', 'birthday', 'community'][plan % 3]], PLANNED_ON);
globalThis.gc?.();
const after = process.memoryUsage().heapUsed;
console.log(
  `Heap change after 50 000 plans: ${((after - before) / 1024 / 1024).toFixed(2)} MB${globalThis.gc ? '' : ' (run with --expose-gc for a settled figure)'}`,
);

console.log('\n## Payloads\n');
console.log(`| Item | Size |\n| :-- | --: |`);
console.log(
  `| Full wedding plan as JSON (never sent over the network) | ${kilobytes(JSON.stringify(plan))} |`,
);
console.log(
  `| Saved progress in localStorage (brief + ticks) | ${kilobytes(JSON.stringify({ version: 1, brief: BRIEFS.wedding, plannedOn: PLANNED_ON, done: plan.tasks.slice(0, 10).map((task) => task.id), vendorStatus: {}, spent: { venue: 400000 }, aiIdeas: [] }))} |`,
);
console.log(`| Calendar export (.ics) | ${kilobytes(toICalendar(plan))} |`);

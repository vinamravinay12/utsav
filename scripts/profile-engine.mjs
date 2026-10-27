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

function time(fn, iterations) {
  for (let i = 0; i < 200; i += 1) fn(); // warm the JIT
  const samples = [];
  for (let i = 0; i < iterations; i += 1) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  const us = (ms) => `${(ms * 1000).toFixed(1)} µs`;
  return {
    p50: us(percentile(samples, 50)),
    p95: us(percentile(samples, 95)),
    p99: us(percentile(samples, 99)),
    opsPerSec: Math.round((iterations / samples.reduce((a, b) => a + b, 0)) * 1000),
  };
}

const kb = (text) => `${(Buffer.byteLength(text) / 1024).toFixed(1)} KB`;

console.log('\n## Engine latency (10 000 runs each)\n');
console.log('| Brief | p50 | p95 | p99 | plans/sec |\n| :-- | --: | --: | --: | --: |');
for (const [name, brief] of Object.entries(BRIEFS)) {
  const r = time(() => buildPlan(brief, PLANNED_ON), 10_000);
  console.log(
    `| ${name} | ${r.p50} | ${r.p95} | ${r.p99} | ${r.opsPerSec.toLocaleString('en-IN')} |`,
  );
}
const plan = buildPlan(BRIEFS.wedding, PLANNED_ON);
const spend = time(
  () => summarizeSpending(plan.budget.lines, { venue: 400_000, decor: 300_000 }),
  10_000,
);
const ics = time(() => toICalendar(plan), 2_000);
console.log(
  `| spending summary | ${spend.p50} | ${spend.p95} | ${spend.p99} | ${spend.opsPerSec.toLocaleString('en-IN')} |`,
);
console.log(
  `| calendar export | ${ics.p50} | ${ics.p95} | ${ics.p99} | ${ics.opsPerSec.toLocaleString('en-IN')} |`,
);

console.log('\n## Memory\n');
globalThis.gc?.();
const before = process.memoryUsage().heapUsed;
for (let i = 0; i < 50_000; i += 1)
  buildPlan(BRIEFS[['wedding', 'birthday', 'community'][i % 3]], PLANNED_ON);
globalThis.gc?.();
const after = process.memoryUsage().heapUsed;
console.log(
  `Heap change after 50 000 plans: ${((after - before) / 1024 / 1024).toFixed(2)} MB${globalThis.gc ? '' : ' (run with --expose-gc for a settled figure)'}`,
);

console.log('\n## Payloads\n');
console.log(`| Item | Size |\n| :-- | --: |`);
console.log(
  `| Full wedding plan as JSON (never sent over the network) | ${kb(JSON.stringify(plan))} |`,
);
console.log(
  `| Saved progress in localStorage (brief + ticks) | ${kb(JSON.stringify({ version: 1, brief: BRIEFS.wedding, plannedOn: PLANNED_ON, done: plan.tasks.slice(0, 10).map((t) => t.id), vendorStatus: {}, spent: { venue: 400000 }, aiIdeas: [] }))} |`,
);
console.log(`| Calendar export (.ics) | ${kb(toICalendar(plan))} |`);

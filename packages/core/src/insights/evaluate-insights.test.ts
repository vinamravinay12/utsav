import { describe, expect, it } from 'vitest';
import { insightRules } from '../catalog/insight-rules.js';
import { findTemplate } from '../catalog/registry.js';
import { derivePlanningContext } from '../context/derive-context.js';
import {
  PLANNED_ON,
  communityBrief,
  kidsBirthdayBrief,
  weddingBrief,
} from '../test-utils/briefs.js';
import type { EventBrief, InsightRule } from '../types/index.js';
import { evaluateInsights, interpolate } from './evaluate-insights.js';

const idsFor = (brief: EventBrief, plannedOn = PLANNED_ON): string[] =>
  evaluateInsights(
    insightRules,
    derivePlanningContext(brief, findTemplate(brief.eventType), plannedOn),
  ).map((insight) => insight.id);

describe('interpolate', () => {
  it('fills numbers with Indian grouping and strings as-is', () => {
    expect(interpolate('{n} guests in {city}', { n: 150_000, city: 'Pune' })).toBe(
      '1,50,000 guests in Pune',
    );
  });

  it('leaves unknown and non-scalar placeholders visible', () => {
    expect(interpolate('{missing} {list} {flag}', { list: ['a'], flag: true })).toBe(
      '{missing} {list} {flag}',
    );
  });
});

describe('evaluateInsights', () => {
  it('orders insights critical, then warning, then info', () => {
    const rules: InsightRule[] = [
      { id: 'i', severity: 'info', title: 'i', detail: '', when: { all: [] } },
      { id: 'c', severity: 'critical', title: 'c', detail: '', when: { all: [] } },
      { id: 'w', severity: 'warning', title: 'w', detail: '', when: { all: [] } },
      { id: 'never', severity: 'critical', title: 'n', detail: '', when: { any: [] } },
    ];
    expect(evaluateInsights(rules, {}).map((insight) => insight.id)).toEqual(['c', 'w', 'i']);
  });

  it('warns a winter wedding about peak season, a tight runway and its dietary needs', () => {
    expect(idsFor(weddingBrief)).toEqual([
      'lead-tight',
      'peak-wedding-season',
      'weekend-large',
      'older-guests',
      'many-diets',
      'sustainable',
    ]);
  });

  it('flags a last-minute, low-budget children’s party', () => {
    expect(idsFor(kidsBirthdayBrief)).toEqual(['lead-rushed', 'children-safety', 'lean-budget']);
  });

  it('puts the monsoon risk first for an open-air fair in July', () => {
    const ids = idsFor(communityBrief);
    expect(ids[0]).toBe('monsoon-open-air');
    expect(ids).toContain('large-crowd');
    expect(ids).not.toContain('peak-wedding-season');
  });

  it('warns about heat for a summer event outdoors and festival demand in October', () => {
    expect(idsFor({ ...communityBrief, eventDate: '2027-04-18' })).toContain('summer-open-air');
    expect(idsFor({ ...communityBrief, eventDate: '2027-10-17' })).toContain('festive-community');
  });

  it('writes the numbers into the message', () => {
    const [rushed] = evaluateInsights(
      insightRules,
      derivePlanningContext(kidsBirthdayBrief, findTemplate('birthday'), PLANNED_ON),
    );
    expect(rushed?.detail).toContain('Only 4 days to go, under the 5-day minimum for a birthday.');
  });
});

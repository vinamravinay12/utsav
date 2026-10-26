import { describe, expect, it } from 'vitest';
import { fieldsOf } from '../conditions/evaluate-condition.js';
import { CONTEXT_FIELDS } from '../context/derive-context.js';
import type { Condition, EventTemplate, EventTypeId } from '../types/index.js';
import { insightRules } from './insight-rules.js';
import { eventTemplates, findTemplate } from './registry.js';
import {
  AGE_GROUP_IDS,
  EVENT_TYPE_IDS,
  INTEREST_IDS,
  SETTING_IDS,
  STYLE_IDS,
} from './vocabulary.js';

/**
 * Invariants over the planning catalogue.
 *
 * The catalogue is data, so these tests are what stop a typo in a category id
 * or an impossible deadline from shipping. Every template must pass every one.
 */
const conditionsOf = (template: EventTemplate): Condition[] =>
  [...template.tasks, ...template.vendors].flatMap((entry) =>
    entry.when === undefined ? [] : [entry.when],
  );

const unique = (values: readonly string[]): boolean => new Set(values).size === values.length;

describe('event catalogue', () => {
  it('covers every event type exactly once', () => {
    expect(eventTemplates.map((template) => template.id).sort()).toEqual(
      [...EVENT_TYPE_IDS].sort(),
    );
  });

  it('finds a template by id and rejects an unknown one', () => {
    expect(findTemplate('wedding').title).toBe('Wedding');
    expect(() => findTemplate('funeral' as EventTypeId)).toThrow(RangeError);
  });

  it('keeps every id unique across the whole catalogue', () => {
    const ids = eventTemplates.flatMap((template) => [
      ...template.tasks.map((task) => task.id),
      ...template.vendors.map((vendor) => vendor.id),
      ...template.ideas.map((idea) => idea.id),
    ]);
    expect(unique(ids)).toBe(true);
  });

  describe.each(eventTemplates.map((template) => [template.id, template] as const))(
    '%s',
    (_id, template) => {
      const categoryIds = template.budget.map((category) => category.id);

      it('has budget shares that sum to exactly 10 000 basis points', () => {
        expect(template.budget.reduce((sum, category) => sum + category.shareBp, 0)).toBe(10_000);
        expect(template.budget.every((category) => category.shareBp > 0)).toBe(true);
      });

      it('has exactly one contingency reserve and unique category ids', () => {
        expect(template.budget.filter((category) => category.isContingency)).toHaveLength(1);
        expect(unique(categoryIds)).toBe(true);
      });

      it('has a sensible lead window and budget tiers', () => {
        expect(template.minLeadDays).toBeLessThan(template.idealLeadDays);
        expect(template.tiers.moderate).toBeLessThan(template.tiers.premium);
      });

      it('schedules every task within the planning horizon and before its latest point', () => {
        for (const task of template.tasks) {
          expect(task.idealDaysBefore, task.id).toBeLessThanOrEqual(template.idealLeadDays);
          expect(task.latestDaysBefore, task.id).toBeLessThanOrEqual(task.idealDaysBefore);
          expect(task.latestDaysBefore < 0, task.id).toBe(task.idealDaysBefore < 0);
          expect([...categoryIds, 'planning'], task.id).toContain(task.category);
        }
      });

      it('has an event-day task and a follow-up after the event', () => {
        expect(template.tasks.some((task) => task.idealDaysBefore === 0)).toBe(true);
        expect(template.tasks.some((task) => task.idealDaysBefore < 0)).toBe(true);
      });

      it('gives every vendor a real category, a valid share and something to ask', () => {
        for (const vendor of template.vendors) {
          expect(categoryIds, vendor.id).toContain(vendor.category);
          expect(vendor.bookDaysBefore, vendor.id).toBeLessThanOrEqual(template.idealLeadDays);
          expect(vendor.categoryShare, vendor.id).toBeGreaterThan(0);
          expect(vendor.depositShare, vendor.id).toBeGreaterThan(0);
          expect(vendor.depositShare, vendor.id).toBeLessThanOrEqual(0.5);
          expect(vendor.questions.length, vendor.id).toBeGreaterThanOrEqual(2);
          expect(vendor.contractChecks.length, vendor.id).toBeGreaterThanOrEqual(2);
        }
      });

      it('never promises vendors more than their category budget', () => {
        for (const category of categoryIds) {
          const share = template.vendors
            .filter((vendor) => vendor.category === category)
            .reduce((sum, vendor) => sum + vendor.categoryShare, 0);
          expect(share, category).toBeLessThanOrEqual(1);
        }
      });

      it('writes every idea in the shared vocabulary against a real category', () => {
        expect(template.ideas.length).toBeGreaterThanOrEqual(12);
        for (const idea of template.ideas) {
          expect(categoryIds, idea.id).toContain(idea.category);
          expect(
            idea.styles.every((style) => STYLE_IDS.includes(style)),
            idea.id,
          ).toBe(true);
          expect(
            idea.interests.every((id) => INTEREST_IDS.includes(id)),
            idea.id,
          ).toBe(true);
          expect(
            idea.settings.every((id) => SETTING_IDS.includes(id)),
            idea.id,
          ).toBe(true);
          expect(
            idea.ageGroups.every((id) => AGE_GROUP_IDS.includes(id)),
            idea.id,
          ).toBe(true);
        }
      });

      it('offers a low-cost idea for every style, so a lean budget is never empty-handed', () => {
        for (const style of STYLE_IDS.filter((id) => id !== 'glamorous')) {
          const options = template.ideas.filter(
            (idea) =>
              idea.costTier === 'low' && (idea.styles.includes(style) || idea.styles.length === 0),
          );
          expect(options.length, style).toBeGreaterThan(0);
        }
      });

      it('only conditions on fields the planning context provides', () => {
        for (const condition of conditionsOf(template)) {
          for (const field of fieldsOf(condition)) {
            expect(CONTEXT_FIELDS).toContain(field);
          }
        }
      });
    },
  );
});

describe('insight rules', () => {
  it('have unique ids and only reference known context fields', () => {
    expect(unique(insightRules.map((rule) => rule.id))).toBe(true);
    for (const rule of insightRules) {
      for (const field of fieldsOf(rule.when)) {
        expect(CONTEXT_FIELDS, rule.id).toContain(field);
      }
      const placeholders = [...`${rule.title} ${rule.detail}`.matchAll(/\{(\w+)\}/g)];
      for (const [, field] of placeholders) {
        expect(CONTEXT_FIELDS, rule.id).toContain(field);
      }
    }
  });
});

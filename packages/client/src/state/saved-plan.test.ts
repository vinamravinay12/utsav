import { describe, expect, it } from 'vitest';
import { aiIdea, savedPlan } from '../test-utils/fixtures.js';
import { STORAGE_KEY, loadSavedPlan, parseSavedPlan, storeSavedPlan } from './saved-plan.js';

describe('parseSavedPlan', () => {
  it('restores a valid plan', () => {
    const plan = savedPlan({
      done: ['w-budget'],
      vendorStatus: { 'w-v-venue': 'booked' },
      spent: { venue: 1000 },
      aiIdeas: [aiIdea],
    });
    expect(parseSavedPlan(JSON.parse(JSON.stringify(plan)))).toEqual(plan);
  });

  it('rejects other versions, shapes and invalid briefs', () => {
    expect(parseSavedPlan(null)).toBeNull();
    expect(parseSavedPlan([])).toBeNull();
    expect(parseSavedPlan({ ...savedPlan(), version: 0 })).toBeNull();
    expect(parseSavedPlan({ ...savedPlan(), plannedOn: 5 })).toBeNull();
    expect(parseSavedPlan({ ...savedPlan(), brief: 'wedding' })).toBeNull();
    expect(parseSavedPlan({ ...savedPlan(), brief: { eventType: 'wedding' } })).toBeNull();
  });

  it('drops individual values that are not what they claim to be', () => {
    const restored = parseSavedPlan({
      ...savedPlan(),
      done: ['w-budget', 7],
      vendorStatus: { a: 'booked', b: 'hacked' },
      spent: { venue: 500, decor: -1, catering: 1.5, photo: 'lots' },
      aiIdeas: [aiIdea, { title: 'half' }, null],
    });
    expect(restored).toMatchObject({
      done: ['w-budget'],
      vendorStatus: { a: 'booked' },
      spent: { venue: 500 },
      aiIdeas: [aiIdea],
    });
  });

  it('treats missing progress fields as empty', () => {
    expect(
      parseSavedPlan({ ...savedPlan(), done: 'x', vendorStatus: [], spent: null, aiIdeas: {} }),
    ).toMatchObject({
      done: [],
      vendorStatus: {},
      spent: {},
      aiIdeas: [],
    });
  });
});

describe('load and store', () => {
  it('round-trips through storage and clears it', () => {
    storeSavedPlan(savedPlan());
    expect(loadSavedPlan()).toEqual(savedPlan());
    storeSavedPlan(null);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadSavedPlan()).toBeNull();
  });

  it('survives corrupt data and storage that throws', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSavedPlan()).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    expect(loadSavedPlan(broken)).toBeNull();
    expect(() => {
      storeSavedPlan(savedPlan(), broken);
    }).not.toThrow();
  });
});

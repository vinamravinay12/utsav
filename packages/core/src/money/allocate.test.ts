import { describe, expect, it } from 'vitest';
import { allocateByWeight } from './allocate.js';

const amounts = (total: number, weights: readonly number[]): number[] =>
  allocateByWeight(total, weights, (weight) => weight).map(({ amount }) => amount);

/** A small deterministic generator so property checks are reproducible. */
function* pseudoRandom(seed: number): Generator<number> {
  let state = seed;
  for (;;) {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    yield state / 2_147_483_648;
  }
}

describe('allocateByWeight', () => {
  it('splits proportionally when the division is exact', () => {
    expect(amounts(1000, [1, 1, 2])).toEqual([250, 250, 500]);
  });

  it('gives leftover units to the largest remainders, earliest first on ties', () => {
    expect(amounts(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(amounts(10, [3, 3, 4])).toEqual([3, 3, 4]);
  });

  it('returns zeros for a zero total or zero weights', () => {
    expect(amounts(0, [1, 2])).toEqual([0, 0]);
    expect(amounts(100, [0, 0])).toEqual([0, 0]);
  });

  it('keeps the item alongside its amount', () => {
    expect(allocateByWeight(10, [{ id: 'a', w: 1 }], (item) => item.w)).toEqual([
      { item: { id: 'a', w: 1 }, amount: 10 },
    ]);
  });

  it('always sums exactly to the total and never goes negative (property check)', () => {
    const random = pseudoRandom(42);
    for (let run = 0; run < 500; run += 1) {
      const total = Math.floor((random.next().value as number) * 10_000_000);
      const count = 1 + Math.floor((random.next().value as number) * 12);
      const weights = Array.from({ length: count }, () => (random.next().value as number) * 5000);
      const parts = amounts(total, weights);
      expect(parts.reduce((sum, part) => sum + part, 0)).toBe(total);
      expect(parts.every((part) => part >= 0 && Number.isInteger(part))).toBe(true);
    }
  });
});

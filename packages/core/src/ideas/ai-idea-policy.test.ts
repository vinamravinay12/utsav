import { describe, expect, it } from 'vitest';
import { AI_IDEA_MAX_CATEGORY_SHARE, formatShare } from './ai-idea-policy.js';

describe('AI idea policy', () => {
  it('caps an idea at 60% of its category and states it in words', () => {
    expect(AI_IDEA_MAX_CATEGORY_SHARE).toBe(0.6);
    expect(formatShare(AI_IDEA_MAX_CATEGORY_SHARE)).toBe('60%');
  });
});

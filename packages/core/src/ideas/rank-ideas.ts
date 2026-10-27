import { INTERESTS, STYLES, SETTINGS, labelOf } from '../catalog/vocabulary.js';
import type { BudgetTier, CostTier, EventBrief, IdeaSpec, RankedIdea } from '../types/index.js';

/** How many catalogue ideas a plan shows. */
export const IDEA_LIMIT = 6;

/** No more than this many picks from one budget category, so ideas cover the whole event. */
export const PER_CATEGORY_LIMIT = 2;

const AFFORDABLE: Readonly<Record<BudgetTier, readonly CostTier[]>> = {
  lean: ['low'],
  moderate: ['low', 'mid'],
  premium: ['low', 'mid', 'high'],
};

/** Points per kind of match; style says most about whether an idea fits the event. */
const MATCH_WEIGHTS = { style: 3, interest: 2, setting: 1, audience: 1 } as const;

/** Hard constraints: an idea that cannot physically or financially work is never shown. */
function isWorkable(idea: IdeaSpec, brief: EventBrief, tier: BudgetTier): boolean {
  const settingOk = idea.settings.length === 0 || idea.settings.includes(brief.setting);
  const audienceOk =
    idea.ageGroups.length === 0 ||
    brief.ageGroup === 'all-ages' ||
    idea.ageGroups.includes(brief.ageGroup);
  return settingOk && audienceOk && AFFORDABLE[tier].includes(idea.costTier);
}

function scoreMatch(idea: IdeaSpec, brief: EventBrief): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let total = 0;
  if (idea.styles.includes(brief.style)) {
    total += MATCH_WEIGHTS.style;
    reasons.push(`Matches your ${labelOf(STYLES, brief.style).toLowerCase()} style`);
  }
  const shared = idea.interests.filter((interest) => brief.interests.includes(interest));
  total += shared.length * MATCH_WEIGHTS.interest;
  if (shared.length > 0) {
    reasons.push(
      `Plays to ${shared.map((id) => labelOf(INTERESTS, id).toLowerCase()).join(' and ')}`,
    );
  }
  if (idea.settings.includes(brief.setting)) {
    total += MATCH_WEIGHTS.setting;
    reasons.push(`Made for an ${labelOf(SETTINGS, brief.setting).toLowerCase()} setting`);
  }
  if (idea.ageGroups.includes(brief.ageGroup)) {
    total += MATCH_WEIGHTS.audience;
    reasons.push('Right for your guests’ ages');
  }
  return { score: total, reasons };
}

/** A stateful filter that admits at most PER_CATEGORY_LIMIT items per category. */
function withinCategoryLimit(): (entry: { idea: IdeaSpec }) => boolean {
  const counts = new Map<string, number>();
  return ({ idea }) => {
    const count = (counts.get(idea.category) ?? 0) + 1;
    counts.set(idea.category, count);
    return count <= PER_CATEGORY_LIMIT;
  };
}

const COST_REASON: Readonly<Record<CostTier, string>> = {
  low: 'Low cost',
  mid: 'Fits a moderate budget',
  high: 'A premium touch your budget allows',
};

/**
 * Picks the catalogue ideas that best match the brief and explains each pick.
 *
 * Ranking is a transparent weighted match — style counts most, then shared
 * interests, then setting and audience — with catalogue order breaking ties,
 * and a per-category cap so the picks spread across the whole event.
 */
export function rankIdeas(
  ideas: readonly IdeaSpec[],
  brief: EventBrief,
  tier: BudgetTier,
  limit: number = IDEA_LIMIT,
): RankedIdea[] {
  return ideas
    .filter((idea) => isWorkable(idea, brief, tier))
    .map((idea, order) => ({ idea, order, ...scoreMatch(idea, brief) }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .filter(withinCategoryLimit())
    .slice(0, limit)
    .map(({ idea, score: total, reasons }) => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      costTier: idea.costTier,
      score: total,
      reasons: [...reasons, COST_REASON[idea.costTier]],
    }));
}

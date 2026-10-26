import type { RankedIdea } from '@utsav/core';
import type { AiIdea } from '../../api/types.js';
import { Badge } from '../ui/Badge.js';
import { AiIdeasSection } from './AiIdeasSection.js';
import { COST_TIER_LABELS } from './labels.js';

interface IdeasPanelProps {
  readonly ideas: readonly RankedIdea[];
  readonly aiIdeas: readonly AiIdea[];
  readonly busy: boolean;
  readonly error: string | null;
  readonly requested: boolean;
  readonly onRequestAi: () => void;
}

/** Catalogue ideas ranked for this brief, plus Gemini's ideas checked against the budget. */
export function IdeasPanel({ ideas, ...ai }: IdeasPanelProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <section aria-labelledby="picked-heading" className="space-y-3">
        <h2 id="picked-heading" className="text-lg font-semibold">
          Picked for you
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <li key={idea.id} className="card space-y-2">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{idea.title}</span>
                <Badge tone="neutral">{COST_TIER_LABELS[idea.costTier]}</Badge>
              </p>
              <p className="text-sm text-ink-soft">{idea.description}</p>
              <p className="text-xs text-muted">Why: {idea.reasons.join(' · ')}</p>
            </li>
          ))}
        </ul>
      </section>
      <AiIdeasSection {...ai} />
    </div>
  );
}

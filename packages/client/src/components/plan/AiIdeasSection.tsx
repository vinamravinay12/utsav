import { AI_IDEA_MAX_CATEGORY_SHARE, formatInr, formatShare } from '@utsav/core';
import type { AiIdea } from '../../api/types.js';
import { Alert } from '../ui/Alert.js';
import { Badge } from '../ui/Badge.js';

interface AiIdeasSectionProps {
  readonly aiIdeas: readonly AiIdea[];
  readonly busy: boolean;
  readonly error: string | null;
  readonly requested: boolean;
  readonly onRequestAi: () => void;
}

/** Label for the request button in its current state. */
function buttonLabel(busy: boolean, hasIdeas: boolean): string {
  if (busy) {
    return 'Thinking up ideas…';
  }
  return hasIdeas ? 'Get different ideas' : 'Get AI ideas';
}

/** The on-demand Gemini ideas, with loading, empty and error states. */
export function AiIdeasSection({
  aiIdeas,
  busy,
  error,
  requested,
  onRequestAi,
}: AiIdeasSectionProps): React.JSX.Element {
  const emptyResult = requested && !busy && error === null && aiIdeas.length === 0;
  return (
    <section aria-labelledby="ai-heading" className="space-y-3" aria-busy={busy}>
      <h2 id="ai-heading" className="text-lg font-semibold">
        Fresh ideas from Gemini
      </h2>
      <p className="text-sm text-muted">
        Written for your city, season, style and guests. Every idea is checked against your budget
        and must fit within {formatShare(AI_IDEA_MAX_CATEGORY_SHARE)} of its category.
      </p>
      <button type="button" className="btn-primary no-print" disabled={busy} onClick={onRequestAi}>
        {buttonLabel(busy, aiIdeas.length > 0)}
      </button>
      {error !== null && <Alert>{error}</Alert>}
      <div aria-live="polite">
        {emptyResult && (
          <p className="text-sm text-muted">
            No new ideas passed the budget checks this time. Try again for a different set.
          </p>
        )}
        <ul className="grid gap-4 md:grid-cols-2">
          {aiIdeas.map((idea) => (
            <li key={idea.title} className="card space-y-2">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{idea.title}</span>
                <Badge tone="info">AI suggestion</Badge>
              </p>
              <p className="text-sm text-ink-soft">{idea.description}</p>
              <p className="text-xs text-muted">
                About {formatInr(idea.estimatedCost)} from {idea.categoryLabel} (
                {idea.shareOfCategory}% of that budget)
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

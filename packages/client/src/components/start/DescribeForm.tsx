import { eventTemplates } from '@utsav/core';
import { useId, useState } from 'react';
import { Alert } from '../ui/Alert.js';

/** Shortest description worth sending; matches the server’s limit. */
export const DESCRIPTION_MIN = 15;
/** Longest description accepted; matches the server’s limit. */
export const DESCRIPTION_MAX = 2000;

interface DescribeFormProps {
  readonly busy: boolean;
  readonly error: string | null;
  readonly onSubmit: (description: string) => void;
}

function ExampleButtons({
  onPick,
}: {
  readonly onPick: (text: string) => void;
}): React.JSX.Element {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">Or start from an example</legend>
      <div className="flex flex-wrap gap-2">
        {eventTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            className="btn-secondary min-h-9 py-1 text-sm"
            onClick={() => {
              onPick(template.examplePrompt);
            }}
          >
            {template.title} example
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** The AI path: the host writes as they would to a friend, and the planner reads it. */
export function DescribeForm({ busy, error, onSubmit }: DescribeFormProps): React.JSX.Element {
  const [text, setText] = useState('');
  const hintId = useId();
  const countId = useId();
  const tooShort = text.trim().length < DESCRIPTION_MIN;
  return (
    <form
      className="card space-y-4"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!tooShort) {
          onSubmit(text.trim());
        }
      }}
    >
      <div>
        <label htmlFor="description" className="label text-base">
          Describe your event
        </label>
        <p id={hintId} className="mb-2 text-sm text-muted">
          What it is, when and where, roughly how many guests, the budget, and anything you love or
          need — dietary needs, a style, what matters most.
        </p>
        <textarea
          id="description"
          className="field min-h-36 resize-y"
          value={text}
          maxLength={DESCRIPTION_MAX}
          aria-describedby={`${hintId} ${countId}`}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <p id={countId} className="mt-1 text-right text-xs text-muted">
          {text.length} / {DESCRIPTION_MAX} characters
        </p>
      </div>
      <ExampleButtons onPick={setText} />
      {error !== null && <Alert>{error}</Alert>}
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy || tooShort}>
        {busy ? 'Reading your description…' : 'Plan my event'}
      </button>
    </form>
  );
}

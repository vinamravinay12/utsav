import { completeBrief, type BriefIssue, type EventBrief } from '@utsav/core';
import { useState } from 'react';
import { Alert } from '../ui/Alert.js';
import { PlaceSection, PreferenceSection } from './BriefPreferences.js';
import { EventSection, SizeSection, type SectionProps } from './BriefSections.js';
import { toDraft, toFormValues, type FormValues } from './form-values.js';

interface BriefFormProps {
  readonly initial: Readonly<Record<string, unknown>>;
  readonly missing: readonly BriefIssue[];
  readonly today: string;
  readonly editing: boolean;
  readonly onSubmit: (brief: EventBrief) => void;
  readonly onCancel: () => void;
}

function FormIntro({
  editing,
  missing,
}: {
  readonly editing: boolean;
  readonly missing: readonly BriefIssue[];
}) {
  return (
    <div>
      <h1 id="brief-title" className="text-2xl font-bold">
        {editing ? 'Edit your event' : 'Check the details'}
      </h1>
      {missing.length > 0 && (
        <p className="mt-2 rounded-lg bg-accent-soft px-4 py-3 text-sm text-ink">
          We filled in what we could from your description. Still needed:{' '}
          {missing.map((issue) => issue.message.replace(/\?$/, '').toLowerCase()).join('; ')}.
        </p>
      )}
    </div>
  );
}

const errorsFrom = (issues: readonly BriefIssue[]): SectionProps['errors'] =>
  Object.fromEntries(issues.map((issue) => [issue.field, issue.message]));

/**
 * Review and edit the brief. Whatever the AI read is pre-filled and editable;
 * the engine's own validator decides whether the brief is complete, so the
 * form and the server can never disagree about what a valid brief is.
 */
export function BriefForm({
  initial,
  missing,
  today,
  editing,
  onSubmit,
  onCancel,
}: BriefFormProps): React.JSX.Element {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initial));
  const [issues, setIssues] = useState<readonly BriefIssue[]>([]);
  const set: SectionProps['set'] = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const props: SectionProps = { values, errors: errorsFrom(issues), today, set };
  return (
    <form
      noValidate
      className="space-y-5"
      aria-labelledby="brief-title"
      onSubmit={(event) => {
        event.preventDefault();
        const result = completeBrief(toDraft(values), today);
        if (result.ok) {
          onSubmit(result.brief);
        } else {
          setIssues(result.issues);
        }
      }}
    >
      <FormIntro editing={editing} missing={missing} />
      <EventSection {...props} />
      <SizeSection {...props} />
      <PlaceSection {...props} />
      <PreferenceSection {...props} />
      {issues.length > 0 && (
        <Alert>
          Please fix {issues.length === 1 ? 'one field' : `${String(issues.length)} fields`} above:{' '}
          {issues.map((issue) => issue.message).join(' ')}
        </Alert>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          {editing ? 'Update my plan' : 'Build my plan'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          {editing ? 'Cancel' : 'Start again'}
        </button>
      </div>
    </form>
  );
}

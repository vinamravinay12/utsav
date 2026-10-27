import { DescribeForm } from './DescribeForm.js';

interface StartScreenProps {
  readonly busy: boolean;
  readonly error: string | null;
  readonly onDescribe: (description: string) => void;
  readonly onManual: () => void;
}

const STEPS: readonly (readonly [string, string])[] = [
  ['Describe it', 'In your own words. Gemini reads out the date, guests, budget, style and needs.'],
  ['Check the details', 'Fix anything it misread and answer what it could not find.'],
  [
    'Get your plan',
    'A budget split, a dated timeline, vendor checklists and ideas chosen for you.',
  ],
];

/** The home page: what Utsav does, the description box and the no-AI route. */
export function StartScreen({
  busy,
  error,
  onDescribe,
  onManual,
}: StartScreenProps): React.JSX.Element {
  return (
    <div className="space-y-8">
      <section aria-labelledby="hero-title" className="space-y-3 pt-4">
        <h1 id="hero-title" className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Plan your wedding, birthday or community event — properly.
        </h1>
        <p className="max-w-2xl text-lg text-ink-soft">
          Tell Utsav about your event and get a complete plan: where every rupee goes, what to do
          each week, which vendors to book by when, and ideas that fit your style and budget.
        </p>
      </section>
      <DescribeForm busy={busy} error={error} onSubmit={onDescribe} />
      <p className="text-sm text-ink-soft">
        Prefer not to use AI?{' '}
        <button
          type="button"
          className="font-semibold text-brand underline underline-offset-2"
          onClick={onManual}
        >
          Fill in the details yourself
        </button>
        .
      </p>
      <section aria-labelledby="how-title">
        <h2 id="how-title" className="mb-3 text-xl font-semibold">
          How it works
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(([title, detail], index) => (
            <li key={title} className="card">
              <p className="text-sm font-semibold text-accent">Step {index + 1}</p>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-ink-soft">{detail}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

import type { ThemePreference } from '../../state/use-theme.js';

interface ThemeToggleProps {
  readonly preference: ThemePreference;
  readonly onChange: (preference: ThemePreference) => void;
}

const OPTIONS: readonly (readonly [ThemePreference, string])[] = [
  ['light', 'Light'],
  ['system', 'System'],
  ['dark', 'Dark'],
];

/**
 * Three explicit choices rather than a two-state switch.
 *
 * A plain toggle cannot express "follow my device", which is what most people
 * want and what the page does before any choice is made. Radios carry the
 * one-of-three meaning natively, so a screen reader announces the current state
 * without any ARIA.
 */
export function ThemeToggle({ preference, onChange }: ThemeToggleProps): React.JSX.Element {
  return (
    <fieldset className="rounded-full border border-line bg-card p-0.5">
      <legend className="sr-only">Colour theme</legend>
      <div className="flex">
        {OPTIONS.map(([value, label]) => (
          <label
            key={value}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
              preference === value ? 'bg-brand text-on-brand' : 'text-muted hover:text-ink'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={preference === value}
              onChange={() => {
                onChange(value);
              }}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

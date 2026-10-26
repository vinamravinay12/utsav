import { useId } from 'react';

interface ChoiceGroupProps {
  readonly legend: string;
  readonly hint?: string;
  readonly error?: string | undefined;
  readonly name: string;
  readonly options: readonly (readonly [string, string])[];
  /** One value for radios; several for checkboxes. */
  readonly selected: readonly string[];
  readonly multiple?: boolean;
  /** Further boxes are disabled once this many are ticked. */
  readonly max?: number;
  readonly onChange: (selected: string[]) => void;
}

/**
 * A fieldset of native radios or checkboxes styled as chips. Native inputs
 * carry their checked state and grouping to assistive technology with no ARIA.
 */
export function ChoiceGroup(props: ChoiceGroupProps): React.JSX.Element {
  const { legend, hint, error, name, options, selected, multiple = false, max, onChange } = props;
  const errorId = useId();
  const full = max !== undefined && selected.length >= max;
  const toggle = (value: string): string[] => {
    if (!multiple) {
      return [value];
    }
    return selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value];
  };
  return (
    <fieldset aria-describedby={error === undefined ? undefined : errorId}>
      <legend className="label">{legend}</legend>
      {hint !== undefined && <p className="-mt-1 mb-2 text-xs text-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(([value, label]) => {
          const checked = selected.includes(value);
          return (
            <label
              key={value}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 ${
                checked ? 'border-brand bg-brand text-on-brand' : 'border-line bg-card text-ink'
              }`}
            >
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={name}
                value={value}
                checked={checked}
                disabled={!checked && multiple && full}
                className="sr-only"
                onChange={() => {
                  onChange(toggle(value));
                }}
              />
              {label}
            </label>
          );
        })}
      </div>
      {error !== undefined && (
        <p id={errorId} className="mt-1 text-sm font-medium text-danger-fg">
          {error}
        </p>
      )}
    </fieldset>
  );
}

import { useId } from 'react';

interface FieldShellProps {
  readonly label: string;
  readonly hint?: string | undefined;
  readonly error?: string | undefined;
  readonly children: (ids: {
    readonly id: string;
    readonly describedBy: string | undefined;
  }) => React.ReactNode;
}

/**
 * Label, hint and error wiring shared by every input: the control is named by
 * its label and described by its hint and error, so a screen reader announces
 * what is wrong as the host lands on it.
 */
export function FieldShell({ label, hint, error, children }: FieldShellProps): React.JSX.Element {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
    .filter((value) => value !== null)
    .join(' ');
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {hint !== undefined && (
        <p id={hintId} className="-mt-1 mb-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {children({ id, describedBy: describedBy.length > 0 ? describedBy : undefined })}
      {error !== undefined && (
        <p id={errorId} className="mt-1 text-sm font-medium text-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputFieldProps {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string | undefined;
  readonly type: 'text' | 'date';
  /** Shows a numeric keypad on phones while still accepting "18,00,000". */
  readonly numeric?: boolean;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly min?: string;
  readonly max?: string;
  readonly maxLength?: number;
}

export function InputField({
  label,
  hint,
  error,
  type,
  numeric = false,
  value,
  onChange,
  ...limits
}: InputFieldProps): React.JSX.Element {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <input
          id={id}
          type={type}
          inputMode={numeric ? 'numeric' : undefined}
          className="field"
          value={value}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          {...limits}
        />
      )}
    </FieldShell>
  );
}

interface SelectFieldProps {
  readonly label: string;
  readonly error?: string | undefined;
  readonly value: string;
  readonly options: readonly (readonly [string, string])[];
  readonly onChange: (value: string) => void;
}

export function SelectField({
  label,
  error,
  value,
  options,
  onChange,
}: SelectFieldProps): React.JSX.Element {
  return (
    <FieldShell label={label} error={error}>
      {({ id, describedBy }) => (
        <select
          id={id}
          className="field"
          value={value}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        >
          <option value="">Choose…</option>
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

const TONES: Readonly<Record<Tone, string>> = {
  ok: 'bg-ok-bg text-ok-fg',
  warn: 'bg-warn-bg text-warn-fg',
  danger: 'bg-danger-bg text-danger-fg',
  info: 'bg-info-bg text-info-fg',
  neutral: 'bg-brand-soft text-ink-soft',
};

/** A status pill. Meaning is always in the text, never in the colour alone. */
export function Badge({
  tone,
  children,
}: {
  readonly tone: Tone;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

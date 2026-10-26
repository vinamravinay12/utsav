import type { ThemePreference } from '../../state/use-theme.js';
import { ThemeToggle } from './ThemeToggle.js';

interface HeaderProps {
  readonly theme: ThemePreference;
  readonly onThemeChange: (preference: ThemePreference) => void;
}

export function Header({ theme, onThemeChange }: HeaderProps): React.JSX.Element {
  return (
    <header className="no-print border-b border-line bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <a href="/" className="flex items-center gap-2 text-lg font-bold text-brand">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          Utsav
          <span className="hidden text-sm font-normal text-muted sm:inline">event planner</span>
        </a>
        <ThemeToggle preference={theme} onChange={onThemeChange} />
      </div>
    </header>
  );
}

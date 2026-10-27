import type { ThemePreference } from '../../state/use-theme.js';
import { ThemeToggle } from './ThemeToggle.js';

interface HeaderProps {
  readonly theme: ThemePreference;
  readonly onThemeChange: (preference: ThemePreference) => void;
  /** Clears everything and returns to the home page. */
  readonly onStartAfresh: () => void;
}

export function Header({ theme, onThemeChange, onStartAfresh }: HeaderProps): React.JSX.Element {
  return (
    <header className="no-print border-b border-line bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* A real link, so it still works without JavaScript and opens in a new tab;
            a plain click is handled in-app so the saved plan is cleared too. */}
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-brand"
          onClick={(event) => {
            if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
              event.preventDefault();
              onStartAfresh();
            }
          }}
        >
          <img src="/favicon.svg" alt="" width="28" height="28" />
          Utsav
          <span className="hidden text-sm font-normal text-muted sm:inline">event planner</span>
        </a>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-secondary min-h-9 py-1 text-sm"
            onClick={onStartAfresh}
          >
            Start afresh
          </button>
          <ThemeToggle preference={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}

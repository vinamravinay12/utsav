import { useRef } from 'react';

export interface TabDefinition {
  readonly id: string;
  readonly label: string;
  readonly content: React.ReactNode;
}

interface TabsProps {
  readonly label: string;
  readonly tabs: readonly TabDefinition[];
  readonly active: string;
  readonly onSelect: (id: string) => void;
}

interface TabButtonProps {
  readonly tab: TabDefinition;
  readonly selected: boolean;
  readonly buttonRef: (element: HTMLButtonElement | null) => void;
  readonly onSelect: (id: string) => void;
  readonly onKeyDown: (event: React.KeyboardEvent) => void;
}

function TabButton({
  tab,
  selected,
  buttonRef,
  onSelect,
  onKeyDown,
}: TabButtonProps): React.JSX.Element {
  return (
    <button
      ref={buttonRef}
      id={`tab-${tab.id}`}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={`panel-${tab.id}`}
      tabIndex={selected ? 0 : -1}
      className={`min-h-11 whitespace-nowrap border-b-3 px-4 py-2 text-sm font-semibold ${
        selected ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'
      }`}
      onClick={() => {
        onSelect(tab.id);
      }}
      onKeyDown={onKeyDown}
    >
      {tab.label}
    </button>
  );
}

/**
 * The WAI-ARIA tabs pattern: arrow keys, Home and End move between tabs, only
 * the active tab is in the tab order, and each panel is labelled by its tab.
 * Inactive panels stay in the DOM, hidden, so printing shows the whole plan.
 */
export function Tabs({ label, tabs, active, onSelect }: TabsProps): React.JSX.Element {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusTab = (index: number): void => {
    // Wraps past either end, as the pattern specifies.
    const wrapped = (index + tabs.length) % tabs.length;
    for (const target of tabs.slice(wrapped, wrapped + 1)) {
      onSelect(target.id);
    }
    refs.current[wrapped]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent, index: number): void => {
    const moves: Readonly<Record<string, number>> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      focusTab(next);
    }
  };
  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="no-print flex gap-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab, index) => (
          <TabButton
            key={tab.id}
            tab={tab}
            selected={tab.id === active}
            buttonRef={(element) => {
              refs.current[index] = element;
            }}
            onSelect={onSelect}
            onKeyDown={(event) => {
              onKeyDown(event, index);
            }}
          />
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-5"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

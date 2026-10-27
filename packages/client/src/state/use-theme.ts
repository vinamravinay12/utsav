import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'utsav-theme';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

/**
 * Reads the stored preference.
 *
 * Storage can throw outright in a private window or with site data blocked, so
 * every access is guarded and falls back to following the system.
 */
export function readStoredPreference(
  storage: Pick<Storage, 'getItem'> | undefined,
): ThemePreference {
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function persist(preference: ThemePreference): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // A preference we cannot store is not worth failing a render over.
  }
}

/**
 * Applies the preference to the document.
 *
 * `system` removes the attribute entirely rather than resolving it, so the CSS
 * media query stays in charge — that is what keeps the very first paint correct
 * without an inline script, which the strict CSP forbids.
 */
function apply(preference: ThemePreference): void {
  const root = globalThis.document.documentElement;
  if (preference === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', preference);
  }
}

export interface Theme {
  readonly preference: ThemePreference;
  readonly setPreference: (preference: ThemePreference) => void;
}

/** The host’s theme preference, applied to the document and remembered. */
export function useTheme(): Theme {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference(globalThis.localStorage),
  );

  useEffect(() => {
    apply(preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference): void => {
    setPreferenceState(next);
    persist(next);
  }, []);

  return { preference, setPreference };
}

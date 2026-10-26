import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredPreference, useTheme } from './use-theme.js';

const KEY = 'utsav-theme';

afterEach(() => {
  globalThis.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  vi.unstubAllGlobals();
});

describe('readStoredPreference', () => {
  it('follows the system when nothing is stored', () => {
    expect(readStoredPreference({ getItem: () => null })).toBe('system');
  });

  it('returns a stored preference', () => {
    expect(readStoredPreference({ getItem: () => 'dark' })).toBe('dark');
    expect(readStoredPreference({ getItem: () => 'light' })).toBe('light');
  });

  it('ignores a stored value that is not a preference', () => {
    expect(readStoredPreference({ getItem: () => 'purple' })).toBe('system');
  });

  it('follows the system when storage is unavailable', () => {
    expect(readStoredPreference(undefined)).toBe('system');
  });

  it('survives storage that throws, as in a private window', () => {
    expect(
      readStoredPreference({
        getItem: () => {
          throw new Error('SecurityError');
        },
      }),
    ).toBe('system');
  });
});

describe('useTheme', () => {
  it('starts by following the system, with no attribute set', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe('system');
    // No attribute means the CSS media query stays in charge, which is what
    // keeps the first paint correct without an inline script.
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('stamps an explicit choice onto the document', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setPreference('dark');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => {
      result.current.setPreference('light');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('removes the attribute again when handed back to the system', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setPreference('dark');
    });
    act(() => {
      result.current.setPreference('system');
    });
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('remembers the choice for next time', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setPreference('dark');
    });
    expect(globalThis.localStorage.getItem(KEY)).toBe('dark');
  });

  it('restores a stored choice on load', () => {
    globalThis.localStorage.setItem(KEY, 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('still applies the theme when the choice cannot be stored', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      clear: () => undefined,
    });
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setPreference('dark');
    });
    expect(result.current.preference).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Moving to a new page — another stage, or a fresh start — replaces the whole
 * view, so focus and scroll move with it and a screen reader hears the new
 * content. The first render is left alone: focus starts at the top of the document.
 */
export function usePageFocus(page: string): RefObject<HTMLElement | null> {
  const main = useRef<HTMLElement>(null);
  const shown = useRef(page);
  useEffect(() => {
    if (page !== shown.current) {
      shown.current = page;
      main.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    }
  }, [page]);
  return main;
}

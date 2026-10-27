/** Lets keyboard users jump past the header; visible only when focused. */
export function SkipLink(): React.JSX.Element {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-brand px-4 py-2 text-on-brand focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
    >
      Skip to main content
    </a>
  );
}

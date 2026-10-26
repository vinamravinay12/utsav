/** An error the host needs to read now; announced immediately by screen readers. */
export function Alert({ children }: { readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger-solid bg-danger-bg px-4 py-3 text-sm text-danger-fg"
    >
      {children}
    </p>
  );
}

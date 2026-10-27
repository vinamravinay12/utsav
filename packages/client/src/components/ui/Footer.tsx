/** Plain statement of where data goes and where the numbers come from. */
export function Footer(): React.JSX.Element {
  return (
    <footer className="no-print mt-12 border-t border-line">
      <div className="mx-auto max-w-5xl space-y-1 px-4 py-6 text-sm text-muted">
        <p>
          Your plan is saved only in this browser. Event descriptions are sent to Google Gemini to
          read them; nothing is stored on our servers.
        </p>
        <p>
          Budgets, dates and checklists come from Utsav’s planning rules, not from the AI. Costs are
          planning estimates — confirm quotes with vendors.
        </p>
      </div>
    </footer>
  );
}

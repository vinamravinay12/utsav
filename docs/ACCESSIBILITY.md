# Accessibility

Target: **WCAG 2.2 AA**. Measured: **Lighthouse Accessibility 100** (mobile and desktop) and zero
axe violations at every step of the journey in automated tests.

## Structure

- Landmarks: `header`, `main` (target of the skip link), `footer`; one `h1` per stage; headings
  nest in order within each tab panel.
- The skip link is the first focusable element and becomes visible on focus.
- When the stage changes (start → review → plan) focus moves to `main` and the page scrolls to the
  top, so a screen-reader user hears the new content rather than the old position.

## Forms

- Every input has a visible `<label>`; hints and errors are attached with `aria-describedby`, and
  invalid inputs carry `aria-invalid`, so the error is read when the field is focused.
- Choice chips are **native radios and checkboxes** inside `fieldset`/`legend`; state is announced
  without ARIA. Disabled chips (the fourth priority) are truly `disabled`.
- Validation summaries use `role="alert"`; the AI's "still needed" note is plain text above the form.
- Numeric fields use `inputMode="numeric"` but accept "18,00,000" as written.

## The dashboard

- Tabs follow the WAI-ARIA tabs pattern: `role="tablist"`/`tab`/`tabpanel`, `aria-selected`,
  `aria-controls`, roving `tabIndex`, Arrow Left/Right with wrap-around, Home and End.
- Readiness is a native `<progress>` with a visible percentage and a text summary.
- The budget is a real `<table>` with a caption, `scope`d headers and a total row; each spend input
  is named for its category ("Spent so far on Venue").
- Status is always in words ("Over budget", "At risk — do now", "Booked"), never colour alone.
- Rebalancing advice and AI results sit in `aria-live="polite"` regions; loading buttons change
  their label and the region sets `aria-busy`.
- Vendor questions use native `<details>`/`<summary>`.

## Visual

- Colours are CSS custom properties for light and dark themes, chosen so text tokens meet 4.5:1 on
  both page and card surfaces; the theme follows the system unless the host picks one.
- Focus is a 3 px outline in the accent colour on every focusable element.
- Touch targets are at least 44 px high (`min-h-11`) for buttons and tabs.
- `prefers-reduced-motion` disables transitions.
- The print stylesheet shows every tab's content and hides controls, so the printed plan is complete.

## Enforcement

- `eslint-plugin-jsx-a11y` **strict** config as errors on every `.tsx` file.
- `vitest-axe` assertions in `App.test.tsx`, `BriefForm.test.tsx`, `Tabs.test.tsx` and
  `panels.test.tsx`.

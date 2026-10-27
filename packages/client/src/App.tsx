import { Suspense, lazy } from 'react';
import { BriefForm } from './components/brief/BriefForm.js';
import { StartScreen } from './components/start/StartScreen.js';
import { Footer } from './components/ui/Footer.js';
import { Header } from './components/ui/Header.js';
import { SkipLink } from './components/ui/SkipLink.js';
import { todayIso } from './lib/dates.js';
import { useExtract } from './state/use-extract.js';
import { usePageFocus } from './state/use-page-focus.js';
import { usePlanner } from './state/use-planner.js';
import { useStartAfresh } from './state/use-start-afresh.js';
import { useTheme } from './state/use-theme.js';

// The dashboard and the planning engine behind it load only once there is a plan.
const PlanDashboard = lazy(() => import('./components/plan/PlanDashboard.js'));

/** The whole app: describe the event, review the brief, then work through the plan. `today` is injectable for tests. */
export function App({ today = todayIso() }: { readonly today?: string }): React.JSX.Element {
  const theme = useTheme();
  const [state, dispatch] = usePlanner();
  const extraction = useExtract(today, dispatch);
  const { session, startAfresh } = useStartAfresh({
    hasPlan: state.saved !== null,
    dispatch,
    clearExtraction: extraction.clear,
  });
  const main = usePageFocus(`${state.stage}-${String(session)}`);
  return (
    <>
      <SkipLink />
      <Header
        theme={theme.preference}
        onThemeChange={theme.setPreference}
        onStartAfresh={startAfresh}
      />
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-6 focus:outline-none"
      >
        {state.stage === 'start' && (
          <StartScreen
            key={session}
            busy={extraction.busy}
            error={extraction.error}
            onDescribe={extraction.describe}
            onManual={() => {
              dispatch({ type: 'start-manual' });
            }}
          />
        )}
        {state.stage === 'review' && (
          <BriefForm
            initial={state.draft}
            missing={state.missing}
            today={today}
            editing={state.saved !== null}
            onSubmit={(brief) => {
              dispatch({ type: 'planned', brief, plannedOn: today });
            }}
            onCancel={() => {
              dispatch({ type: 'cancel-edit' });
            }}
          />
        )}
        {state.stage === 'plan' && state.saved !== null && (
          <Suspense fallback={<p role="status">Building your plan…</p>}>
            <PlanDashboard saved={state.saved} today={today} dispatch={dispatch} />
          </Suspense>
        )}
      </main>
      <Footer />
    </>
  );
}

import { BRIEF_LIMITS, EVENT_TYPES } from '@utsav/core';
import { ChoiceGroup } from './ChoiceGroup.js';
import { InputField } from './fields.js';
import { bindInput, bindSingleChoice, type BriefSectionProps } from './form-bindings.js';
import { FormSection } from './FormSection.js';

/** Event type, name and date. Changing the type clears priorities, which are per-type categories. */
export function EventSection(form: BriefSectionProps): React.JSX.Element {
  const eventType = bindSingleChoice(form, 'eventType');
  return (
    <FormSection title="The event">
      <ChoiceGroup
        legend="Type of event"
        options={EVENT_TYPES}
        {...eventType}
        onChange={(selected) => {
          eventType.onChange(selected);
          // Priorities are budget categories, which differ by event type.
          form.setField('priorities', []);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Event name (optional)"
          type="text"
          maxLength={BRIEF_LIMITS.maxNameLength}
          {...bindInput(form, 'name')}
        />
        <InputField label="Date" type="date" min={form.today} {...bindInput(form, 'eventDate')} />
      </div>
    </FormSection>
  );
}

/** Guest count and total budget. */
export function SizeSection(form: BriefSectionProps): React.JSX.Element {
  return (
    <FormSection title="Guests and budget">
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Number of guests"
          type="text"
          numeric
          hint={`Up to ${String(BRIEF_LIMITS.maxGuests)}.`}
          {...bindInput(form, 'guestCount')}
        />
        <InputField
          label="Total budget (₹)"
          type="text"
          numeric
          hint="Whole rupees, e.g. 1800000 for 18 lakh."
          {...bindInput(form, 'totalBudget')}
        />
      </div>
    </FormSection>
  );
}

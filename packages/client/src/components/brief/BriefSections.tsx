import { BRIEF_LIMITS, EVENT_TYPES } from '@utsav/core';
import { ChoiceGroup } from './ChoiceGroup.js';
import { InputField } from './fields.js';
import { FormSection } from './FormSection.js';
import type { FormValues } from './form-values.js';

export interface SectionProps {
  readonly values: FormValues;
  readonly errors: Readonly<Partial<Record<keyof FormValues, string>>>;
  readonly today: string;
  readonly set: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
}

export function EventSection({ values, errors, today, set }: SectionProps): React.JSX.Element {
  return (
    <FormSection title="The event">
      <ChoiceGroup
        legend="Type of event"
        name="eventType"
        options={EVENT_TYPES}
        selected={values.eventType === '' ? [] : [values.eventType]}
        error={errors.eventType}
        onChange={([eventType = '']) => {
          set('eventType', eventType);
          // Priorities are budget categories, which differ by event type.
          set('priorities', []);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Event name (optional)"
          type="text"
          value={values.name}
          maxLength={BRIEF_LIMITS.maxNameLength}
          onChange={(value) => {
            set('name', value);
          }}
        />
        <InputField
          label="Date"
          type="date"
          value={values.eventDate}
          min={today}
          error={errors.eventDate}
          onChange={(value) => {
            set('eventDate', value);
          }}
        />
      </div>
    </FormSection>
  );
}

export function SizeSection({ values, errors, set }: SectionProps): React.JSX.Element {
  return (
    <FormSection title="Guests and budget">
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Number of guests"
          type="text"
          numeric
          hint={`Up to ${String(BRIEF_LIMITS.maxGuests)}.`}
          value={values.guestCount}
          error={errors.guestCount}
          onChange={(value) => {
            set('guestCount', value);
          }}
        />
        <InputField
          label="Total budget (₹)"
          type="text"
          numeric
          hint="Whole rupees, e.g. 1800000 for 18 lakh."
          value={values.totalBudget}
          error={errors.totalBudget}
          onChange={(value) => {
            set('totalBudget', value);
          }}
        />
      </div>
    </FormSection>
  );
}

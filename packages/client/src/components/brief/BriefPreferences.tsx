import { AGE_GROUPS, BRIEF_LIMITS, DIETARY, INTERESTS, SETTINGS, STYLES } from '@utsav/core';
import { ChoiceGroup } from './ChoiceGroup.js';
import { InputField, SelectField } from './fields.js';
import {
  bindInput,
  bindMultiChoice,
  bindSingleChoice,
  type BriefSectionProps,
} from './form-bindings.js';
import { FormSection } from './FormSection.js';
import { priorityOptions } from './form-values.js';

/** City, audience, setting and style. */
export function PlaceSection(form: BriefSectionProps): React.JSX.Element {
  return (
    <FormSection title="Place and feel">
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="City or town"
          type="text"
          maxLength={BRIEF_LIMITS.maxCityLength}
          {...bindInput(form, 'city')}
        />
        <SelectField
          label="Who are the guests?"
          options={AGE_GROUPS}
          {...bindInput(form, 'ageGroup')}
        />
      </div>
      <ChoiceGroup legend="Setting" options={SETTINGS} {...bindSingleChoice(form, 'setting')} />
      <ChoiceGroup legend="Style" options={STYLES} {...bindSingleChoice(form, 'style')} />
    </FormSection>
  );
}

/** Budget priorities, interests and dietary needs — all optional. */
export function PreferenceSection(form: BriefSectionProps): React.JSX.Element {
  const priorities = priorityOptions(form.values.eventType);
  return (
    <FormSection title="What matters to you">
      {priorities.length > 0 && (
        <ChoiceGroup
          legend="Spend more on"
          hint={`Pick up to ${String(BRIEF_LIMITS.maxPriorities)}. These get a bigger share of the budget.`}
          max={BRIEF_LIMITS.maxPriorities}
          options={priorities}
          {...bindMultiChoice(form, 'priorities')}
        />
      )}
      <ChoiceGroup
        legend="Interests"
        hint="Used to personalise ideas."
        options={INTERESTS}
        {...bindMultiChoice(form, 'interests')}
      />
      <ChoiceGroup legend="Dietary needs" options={DIETARY} {...bindMultiChoice(form, 'dietary')} />
    </FormSection>
  );
}

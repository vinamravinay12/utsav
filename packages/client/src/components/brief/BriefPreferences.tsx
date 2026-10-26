import { AGE_GROUPS, BRIEF_LIMITS, DIETARY, INTERESTS, SETTINGS, STYLES } from '@utsav/core';
import type { SectionProps } from './BriefSections.js';
import { ChoiceGroup } from './ChoiceGroup.js';
import { InputField, SelectField } from './fields.js';
import { FormSection } from './FormSection.js';
import { priorityOptions } from './form-values.js';

export function PlaceSection({ values, errors, set }: SectionProps): React.JSX.Element {
  return (
    <FormSection title="Place and feel">
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="City or town"
          type="text"
          value={values.city}
          maxLength={BRIEF_LIMITS.maxCityLength}
          error={errors.city}
          onChange={(value) => {
            set('city', value);
          }}
        />
        <SelectField
          label="Who are the guests?"
          value={values.ageGroup}
          options={AGE_GROUPS}
          error={errors.ageGroup}
          onChange={(value) => {
            set('ageGroup', value);
          }}
        />
      </div>
      <ChoiceGroup
        legend="Setting"
        name="setting"
        options={SETTINGS}
        selected={values.setting === '' ? [] : [values.setting]}
        error={errors.setting}
        onChange={([setting = '']) => {
          set('setting', setting);
        }}
      />
      <ChoiceGroup
        legend="Style"
        name="style"
        options={STYLES}
        selected={values.style === '' ? [] : [values.style]}
        error={errors.style}
        onChange={([style = '']) => {
          set('style', style);
        }}
      />
    </FormSection>
  );
}

export function PreferenceSection({ values, set }: SectionProps): React.JSX.Element {
  const priorities = priorityOptions(values.eventType);
  return (
    <FormSection title="What matters to you">
      {priorities.length > 0 && (
        <ChoiceGroup
          legend="Spend more on"
          hint={`Pick up to ${String(BRIEF_LIMITS.maxPriorities)}. These get a bigger share of the budget.`}
          name="priorities"
          multiple
          max={BRIEF_LIMITS.maxPriorities}
          options={priorities}
          selected={values.priorities}
          onChange={(selected) => {
            set('priorities', selected);
          }}
        />
      )}
      <ChoiceGroup
        legend="Interests"
        hint="Used to personalise ideas."
        name="interests"
        multiple
        options={INTERESTS}
        selected={values.interests}
        onChange={(selected) => {
          set('interests', selected);
        }}
      />
      <ChoiceGroup
        legend="Dietary needs"
        name="dietary"
        multiple
        options={DIETARY}
        selected={values.dietary}
        onChange={(selected) => {
          set('dietary', selected);
        }}
      />
    </FormSection>
  );
}

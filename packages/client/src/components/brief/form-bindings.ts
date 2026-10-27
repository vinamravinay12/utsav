import type { FormValues } from './form-values.js';

/** What every section of the brief form receives: the values, their errors and one setter. */
export interface BriefSectionProps {
  readonly values: FormValues;
  readonly errors: Readonly<Partial<Record<keyof FormValues, string>>>;
  readonly today: string;
  readonly setField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
}

type InputFieldName = 'name' | 'eventDate' | 'guestCount' | 'totalBudget' | 'city' | 'ageGroup';
type SingleChoiceFieldName = 'eventType' | 'setting' | 'style';
type MultiChoiceFieldName = 'priorities' | 'interests' | 'dietary';

/** Value, error and change handler wiring a text, date or select input to one field. */
export function bindInput(form: BriefSectionProps, field: InputFieldName) {
  return {
    value: form.values[field],
    error: form.errors[field],
    onChange: (value: string): void => {
      form.setField(field, value);
    },
  };
}

/** Wires a radio group to a single-valued field; an empty field means nothing is selected. */
export function bindSingleChoice(form: BriefSectionProps, field: SingleChoiceFieldName) {
  const value = form.values[field];
  return {
    name: field,
    selected: value === '' ? [] : [value],
    error: form.errors[field],
    onChange: ([choice = '']: readonly string[]): void => {
      form.setField(field, choice);
    },
  };
}

/** Wires a checkbox group to a list-valued field. */
export function bindMultiChoice(form: BriefSectionProps, field: MultiChoiceFieldName) {
  return {
    name: field,
    multiple: true,
    selected: form.values[field],
    onChange: (selected: readonly string[]): void => {
      form.setField(field, [...selected]);
    },
  };
}

export function getMatFormFieldPlaceholderConflictError(): Error {
  return Error('Placeholder attribute and child element were both specified.');
}

/** @docs-private */
export function getMatFormFieldDuplicatedHintError(align: string): Error {
  return Error(`A hint was already declared for 'align="${align}"'.`);
}

/** @docs-private */
export function getMatFormFieldMissingControlError(): Error {
  return Error('mat-form-field must contain a MatFormFieldControl.');
}

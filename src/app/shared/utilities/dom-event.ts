export function readEventValue(event: Event): string | null {
  const target = event.target;
  return typeof target === 'object' &&
    target !== null &&
    'value' in target &&
    typeof target.value === 'string'
    ? target.value
    : null;
}

export function readEventChecked(event: Event): boolean | null {
  const target = event.target;
  return typeof target === 'object' &&
    target !== null &&
    'checked' in target &&
    typeof target.checked === 'boolean'
    ? target.checked
    : null;
}

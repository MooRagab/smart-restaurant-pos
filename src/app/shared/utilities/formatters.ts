const currencyFormatter = new Intl.NumberFormat('en-QA', {
  style: 'currency',
  currency: 'QAR',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-QA', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatCurrency(minorUnits: number): string {
  return currencyFormatter.format(minorUnits / 100);
}

export function formatDate(value: Date | number): string {
  return dateFormatter.format(value);
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

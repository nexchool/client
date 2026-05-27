/**
 * Currency helper for INR formatting. Uses Intl.NumberFormat — works in RN
 * via Hermes' Intl shim (Expo SDK 54 ships Intl support).
 */

const fmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const fmtCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!isFinite(n)) return '—';
  return fmt.format(n);
}

export function formatCurrencyCompact(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!isFinite(n)) return '—';
  return fmtCompact.format(n);
}

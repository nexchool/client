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

/**
 * Abbreviated INR for axis ticks and chart labels — ₹1.5Cr, ₹67.4L, ₹8.2K.
 *
 * Mirrors `fmt` in admin-web's dashboard (`src/app/(dashboard)/dashboard/page.tsx`)
 * thresholds and all, so the same seven days read the same on a phone as on
 * the web dashboard. Lakh and crore rather than M/B because the people reading
 * it are Indian school accountants, who do not think in millions.
 *
 * This is for labels beside a bar, where four characters is the budget. Use
 * `formatCurrency` wherever the exact figure is what the person came for.
 */
export function formatCurrencyShort(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

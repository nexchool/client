/**
 * Date/time formatting helpers. Uses Intl.DateTimeFormat (available in the
 * Hermes runtime — the same approach as formatCurrency). All inputs are ISO
 * 8601 strings from the API; invalid/empty inputs render as an em dash.
 */
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | null | undefined): string {
  const d = parse(value);
  return d ? dateFmt.format(d) : "—";
}

export function formatTime(value: string | null | undefined): string {
  const d = parse(value);
  return d ? timeFmt.format(d) : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  const d = parse(value);
  return d ? dateTimeFmt.format(d) : "—";
}

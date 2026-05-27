import type { Palette } from "@/common/theme/palettes";

/**
 * Returns a semantic palette color for a given leave-request status.
 * Pass the active palette from `useTheme()`.
 */
export function statusColor(status: string, palette: Palette): string {
  switch (status) {
    case "approved":
      return palette.success;
    case "rejected":
      return palette.error;
    case "cancelled":
      return palette.onSurfaceVariant;
    default:
      return palette.warning;
  }
}

/**
 * Returns an accent color for each leave type.
 * These are intentional brand accents that stay constant across light/dark
 * (categorical color), so they're not pulled from the palette.
 */
export function leaveTypeColor(type: string): string {
  switch (type) {
    case "casual":
      return "#3B82F6";
    case "sick":
      return "#10B981";
    case "emergency":
      return "#EF4444";
    case "unpaid":
      return "#8B5CF6";
    default:
      return "#6B7280";
  }
}

export const LEAVE_TYPE_ICONS: Record<string, string> = {
  casual: "☀️",
  sick: "🤒",
  emergency: "🚨",
  unpaid: "💰",
  other: "📝",
};

import type { Ionicons } from "@expo/vector-icons";
import type { Palette } from "@/common/theme/palettes";

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Returns a semantic palette token for a given leave-request status.
 * Consumers read `palette[statusAccentToken(status)]`.
 *
 * pending  → warning   (secondary/tertiary family — attention, not error)
 * approved → success
 * rejected → error
 * cancelled→ onSurfaceVariant (muted)
 */
export function statusAccentToken(status: string): keyof Palette {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "cancelled":
      return "onSurfaceVariant";
    default:
      return "warning";
  }
}

/**
 * Returns a semantic palette token used as the accent for each leave type.
 * Categorical accents mapped onto the design-system palette so they track
 * light/dark and stay token-pure (no hex literals).
 */
export function leaveTypeAccentToken(type: string): keyof Palette {
  switch (type) {
    case "casual":
      return "primary";
    case "sick":
      return "success";
    case "emergency":
      return "error";
    case "unpaid":
      return "tertiary";
    default:
      return "onSurfaceVariant";
  }
}

export const LEAVE_TYPE_ICONS: Record<string, IconName> = {
  casual: "sunny-outline",
  sick: "medkit-outline",
  emergency: "warning-outline",
  unpaid: "cash-outline",
  other: "document-text-outline",
};

import type { Palette } from "@/common/theme";
import type { GatepassStatus, GatepassType } from "../adminTypes";

/** Server permission strings for the gate-pass workflow (mirror server constants). */
export const PERM_GP_APPROVE = "hostel.gatepass.approve";
export const PERM_GP_GATEKEEPER = "hostel.gatepass.gatekeeper";
export const PERM_VISITOR_MANAGE = "hostel.visitors.manage";

/** Gate-pass status → accent token + i18n key + English fallback. */
export function gatepassStatusMeta(status: GatepassStatus): {
  tone: keyof Palette;
  key: string;
  fallback: string;
} {
  switch (status) {
    case "pending":
      return { tone: "warning", key: "gatepass.statusPending", fallback: "Pending" };
    case "approved":
      return { tone: "primary", key: "gatepass.statusApproved", fallback: "Approved" };
    case "active":
      return { tone: "secondary", key: "gatepass.statusActive", fallback: "Out" };
    case "closed":
      return { tone: "onSurfaceVariant", key: "gatepass.statusClosed", fallback: "Returned" };
    case "rejected":
      return { tone: "onSurfaceVariant", key: "gatepass.statusRejected", fallback: "Rejected" };
    case "overdue":
      return { tone: "error", key: "gatepass.statusOverdue", fallback: "Overdue" };
    default:
      return { tone: "onSurfaceVariant", key: "gatepass.statusUnknown", fallback: status };
  }
}

/** Gate-pass type → i18n key + English fallback. */
export function gatepassTypeMeta(type: GatepassType): { key: string; fallback: string } {
  return type === "night_out"
    ? { key: "gatepass.typeNight", fallback: "Night out" }
    : { key: "gatepass.typeDay", fallback: "Day out" };
}

import i18n from "@/i18n/i18nextInstance";
import { ApiException } from "@/common/services/api";

/**
 * Maps API-layer errors to localized strings for the login flow.
 * Internal English phrases here identify our own ApiException messages, not user-facing copy.
 */
export function mapLoginApiError(err: unknown): string {
  if (err instanceof ApiException) {
    if (err.status === 0) {
      return i18n.t("auth:errors.network");
    }
    const msg = err.message ?? "";
    if (msg === "Failed to parse response") {
      return i18n.t("auth:errors.parseError");
    }
    if (msg.startsWith("Cannot connect to server")) {
      return i18n.t("auth:errors.network");
    }
    if (msg.startsWith("Request failed")) {
      return i18n.t("auth:errors.requestFailed");
    }
    return i18n.t("auth:errors.generic");
  }
  return i18n.t("auth:errors.loginFailed");
}

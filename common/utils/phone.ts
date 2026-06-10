import { Linking } from "react-native";

/**
 * Strip a phone number down to digits (preserving a leading +) so `tel:`/`sms:`
 * URIs are well-formed. School-entered numbers often carry spaces or dashes
 * ("+91 98765 43210", "098765-43210") which break the dialer otherwise.
 */
function sanitize(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

async function open(scheme: "tel" | "sms", phone: string | null | undefined): Promise<boolean> {
  if (!phone) return false;
  const num = sanitize(phone);
  if (!num) return false;
  try {
    await Linking.openURL(`${scheme}:${num}`);
    return true;
  } catch {
    // Device has no dialer/SMS app (tablet, emulator) — fail soft, never crash.
    // Scheme only, no number, to avoid logging PII.
    console.warn(`[phone] unable to open ${scheme} link`);
    return false;
  }
}

/** Place a phone call. Resolves false (never throws) when the device can't dial. */
export const callPhone = (phone: string | null | undefined) => open("tel", phone);

/** Open the SMS composer. Resolves false (never throws) when unsupported. */
export const messagePhone = (phone: string | null | undefined) => open("sms", phone);

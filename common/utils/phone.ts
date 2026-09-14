import { Linking } from "react-native";

/**
 * Every phone/mobile number field in this app collects a plain 10-digit
 * Indian mobile number — no country code, no formatting. Single source of
 * truth so the input filter, the field's `maxLength` and the validation
 * regex can never drift apart.
 */
export const PHONE_NUMBER_LENGTH = 10;

/** Exactly `PHONE_NUMBER_LENGTH` digits, nothing else. */
export const PHONE_NUMBER_REGEX = /^[0-9]{10}$/;

/**
 * `onChangeText` transform for a phone/mobile number field: strips every
 * non-digit character and caps the result at `PHONE_NUMBER_LENGTH`, so
 * typing, pasting or autofilling can never produce a letter, a symbol, or an
 * 11th digit.
 */
export function sanitizePhoneNumberInput(text: string): string {
  return text.replace(/[^0-9]/g, "").slice(0, PHONE_NUMBER_LENGTH);
}

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

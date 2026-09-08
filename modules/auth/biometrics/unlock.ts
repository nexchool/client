/**
 * Asking the phone to prove its owner is present.
 *
 * One function, one question, three answers — and the reason it is not a
 * boolean is that "no" and "not this time" want different screens. A person who
 * cancelled the prompt should see the lock screen with the button they meant to
 * press; a person whose phone has locked them out of biometrics entirely should
 * be told to sign in with their password instead of tapping a control that
 * cannot succeed.
 *
 * **The device passcode stays available.** `disableDeviceFallback` is left at
 * its default of `false` on purpose: removing a fingerprint, or an OS update
 * that drops an enrolment, would otherwise strand somebody outside a session
 * they are entitled to. A passcode is still the device owner proving presence,
 * which is exactly what this gate is for.
 *
 * **What this is not.** It proves the phone's owner is here. It does not prove
 * *which* person that is — a phone shared between a parent and a child has both
 * their faces on it, and either opens whichever account is signed in. That is a
 * limit of biometry itself, not of this code, and it is why this gate stands in
 * front of a session that already exists rather than in front of signing in.
 */

import * as LocalAuthentication from 'expo-local-authentication';

export type UnlockOutcome =
  /** The owner is present. */
  | 'unlocked'
  /** They dismissed the prompt, or chose to sign in another way. Try again. */
  | 'dismissed'
  /** Biometrics cannot work here now — too many failures, or none enrolled. */
  | 'unavailable';

type Prompt = {
  message: string;
  cancelLabel: string;
};

export async function unlock({ message, cancelLabel }: Prompt): Promise<UnlockOutcome> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: message,
      cancelLabel,
      // See the note above — the passcode is a fallback, never disabled.
      disableDeviceFallback: false,
    });

    if (result.success) return 'unlocked';

    switch (result.error) {
      case 'user_cancel':
      case 'app_cancel':
      case 'system_cancel':
      case 'user_fallback':
      case 'authentication_failed':
      case 'timeout':
        return 'dismissed';
      default:
        // `lockout`, `not_enrolled`, `passcode_not_set`, `not_available` and
        // the rest all mean the same thing to the screen: stop offering this,
        // offer the password.
        return 'unavailable';
    }
  } catch {
    return 'unavailable';
  }
}

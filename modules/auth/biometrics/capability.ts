/**
 * Whether this phone can offer biometric unlock at all, and what to call it.
 *
 * Asked before anything is offered, because a toggle that appears and then
 * fails is worse than one that was never there — and because the honest answer
 * differs by device in ways the person holding it already understands. An
 * iPhone says Face ID, most Android phones say fingerprint, and a phone with
 * neither should be shown nothing rather than a control that errors.
 *
 * Enrolment is required to *enable* the feature, not to use it later. That
 * asymmetry is deliberate: `unlock()` allows the device passcode as a fallback,
 * so somebody who removes a fingerprint months from now gets a passcode prompt
 * instead of losing their session — but offering "unlock with your fingerprint"
 * to a phone that has no fingerprint on it would be a lie at the moment it is
 * hardest to explain.
 */

import * as LocalAuthentication from 'expo-local-authentication';

/** What this phone calls the thing, so copy can use the person's own word. */
export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'biometrics';

export type BiometricCapability = {
  /** Whether biometric unlock may be offered on this device, right now. */
  isAvailable: boolean;
  /** Why not, when it is not. Read by nothing that renders — it exists so a
   *  support conversation about "the toggle isn't there" has an answer. */
  reason: 'available' | 'no_hardware' | 'not_enrolled' | 'unavailable';
  kind: BiometricKind;
};

const UNAVAILABLE: BiometricCapability = {
  isAvailable: false,
  reason: 'unavailable',
  kind: 'biometrics',
};

function kindFrom(types: LocalAuthentication.AuthenticationType[]): BiometricKind {
  // Face first: a phone that has both is almost always used by its face, and
  // that is the prompt the OS will actually show.
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
  return 'biometrics';
}

export async function readBiometricCapability(): Promise<BiometricCapability> {
  try {
    const [hasHardware, isEnrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    const kind = kindFrom(types);
    if (!hasHardware) return { isAvailable: false, reason: 'no_hardware', kind };
    if (!isEnrolled) return { isAvailable: false, reason: 'not_enrolled', kind };
    return { isAvailable: true, reason: 'available', kind };
  } catch {
    // The module can throw on a simulator, on the web target, or on an OS that
    // refuses the query. None of those is worth an error screen: the feature
    // simply is not on offer.
    return UNAVAILABLE;
  }
}

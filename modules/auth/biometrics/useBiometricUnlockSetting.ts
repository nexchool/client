/**
 * The state behind the biometric-unlock switch, and the one rule it enforces.
 *
 * **Turning it on requires passing the prompt, then and there.** Not because
 * the prompt proves anything the app needs at that moment — the person is
 * already signed in and holding the phone — but because the switch is a
 * promise about the *next* cold start, and a promise made on a phone where the
 * prompt turns out not to work is one the person only discovers is broken when
 * they are locked out of their own session. Better to fail here, with the
 * password still fresh, than there.
 *
 * Turning it off asks for nothing. Whoever is looking at this screen is already
 * inside the app; making them prove themselves to *lower* a gate they are
 * standing behind would be ceremony, not security.
 */

import { useCallback, useEffect, useState } from 'react';

import {
  getBiometricUnlockEnabled,
  setBiometricUnlockEnabled,
} from '@/common/utils/storage';

import { readBiometricCapability, type BiometricCapability } from './capability';
import { unlock } from './unlock';

type Prompt = { message: string; cancelLabel: string };

export function useBiometricUnlockSetting() {
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  /** True when the last attempt to switch it on did not pass the prompt. */
  const [didFail, setDidFail] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      readBiometricCapability(),
      getBiometricUnlockEnabled(),
    ]).then(([readCapability, stored]) => {
      if (!active) return;
      setCapability(readCapability);
      setIsEnabled(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(
    async (next: boolean, prompt: Prompt) => {
      if (isBusy) return;
      setIsBusy(true);
      setDidFail(false);
      try {
        if (!next) {
          await setBiometricUnlockEnabled(false);
          setIsEnabled(false);
          return;
        }

        const outcome = await unlock(prompt);
        if (outcome !== 'unlocked') {
          // The switch stays where it was. Nothing is stored, so a cold start
          // is unaffected — the failure costs the person nothing but a retry.
          setDidFail(true);
          return;
        }

        await setBiometricUnlockEnabled(true);
        setIsEnabled(true);
      } finally {
        setIsBusy(false);
      }
    },
    [isBusy]
  );

  return {
    /** `null` until the probe answers — the row should not render yet. */
    capability,
    isEnabled,
    isBusy,
    didFail,
    toggle,
  };
}

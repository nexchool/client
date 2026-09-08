import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useDialog } from '@/common/feedback';
import {
  getBiometricOfferMade,
  getBiometricUnlockEnabled,
  setBiometricOfferMade,
  setBiometricUnlockEnabled,
} from '@/common/utils/storage';
import { readBiometricCapability } from '@/modules/auth/biometrics/capability';
import { unlock } from '@/modules/auth/biometrics/unlock';

/**
 * Offers biometric unlock once, and then never again.
 *
 * A switch buried in Settings is found by almost nobody, and a feature nobody
 * finds is a feature nobody has. So the offer comes to them — once, just after
 * they have signed in, which is the one moment in the week when the cost of
 * typing a password is fresh enough for the offer to mean anything.
 *
 * "Once" is load-bearing in both directions. `setBiometricOfferMade` is written
 * the moment the question is asked — not when it is answered — so a person who
 * declines, or who dismisses it, or who kills the app mid-dialog, is not asked
 * again on their next launch. And `clearAuth` wipes the flag on sign-out, so
 * the *next* person on a shared phone gets their own offer rather than
 * inheriting a decision somebody else made.
 *
 * Renders nothing. It is a piece of behaviour that happens to need a place in
 * the tree, and the protected layout is the first place that is only reached
 * when somebody is properly signed in.
 */
export function BiometricUnlockOffer() {
  const { t } = useTranslation(['settings', 'auth']);
  const { confirm } = useDialog();
  // Once per mount, not once per render — `confirm` is a promise and a second
  // render must not stack a second dialog on the first.
  const hasAskedRef = useRef(false);

  useEffect(() => {
    if (hasAskedRef.current) return;
    hasAskedRef.current = true;

    void (async () => {
      const [capability, alreadyEnabled, alreadyOffered] = await Promise.all([
        readBiometricCapability(),
        getBiometricUnlockEnabled(),
        getBiometricOfferMade(),
      ]);

      if (!capability.isAvailable || alreadyEnabled || alreadyOffered) return;

      // Written before the question, so that a dismissed or abandoned dialog
      // still counts as asked. Being pestered on every launch is how a helpful
      // offer turns into a thing people learn to tap past.
      await setBiometricOfferMade();

      const accepted = await confirm({
        title: t('settings:biometrics.offerTitle'),
        description: t('settings:biometrics.offerBody'),
        confirmLabel: t('settings:biometrics.offerAccept'),
        cancelLabel: t('settings:biometrics.offerDecline'),
      });
      if (!accepted) return;

      // Same rule as the Settings switch: nothing is stored unless the prompt
      // actually passes on this phone. An offer accepted and quietly not
      // honoured would be discovered at the worst possible moment — the next
      // cold start, with no password in mind.
      const outcome = await unlock({
        message: t('auth:biometrics.promptMessage'),
        cancelLabel: t('auth:biometrics.usePassword'),
      });
      if (outcome === 'unlocked') await setBiometricUnlockEnabled(true);
    })();
    // Deliberately once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

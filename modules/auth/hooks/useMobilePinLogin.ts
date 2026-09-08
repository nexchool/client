import { useState } from 'react';

import i18n from '@/i18n/i18nextInstance';
import { LoginFieldError } from '@/modules/auth/errors/LoginFieldError';
import { mapLoginApiError } from '@/modules/auth/utils/mapLoginApiError';
import { useAuth } from './useAuth';

/** How many digits a PIN has. The server's own constant, mirrored. */
export const PIN_LENGTH = 6;

/**
 * Signing in with a mobile number and a PIN.
 *
 * The same shape as `useLogin`: validate what can be checked here, hand the
 * rest to the server, and turn a field problem into a `LoginFieldError` the
 * screen can put under the right box.
 *
 * The validation is deliberately shallow — length and digits, nothing about
 * which numbers exist or which PINs are weak. Checking either here would
 * either be wrong (the app cannot know) or a leak (refusing a PIN for one
 * person and not another says something about that person).
 */
export const useMobilePinLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithMobilePin } = useAuth();

  const signIn = async (mobile: string, pin: string) => {
    setError(null);
    setLoading(true);

    try {
      if (!mobile?.trim()) {
        throw new LoginFieldError(
          'mobile',
          i18n.t('auth:validation.mobileRequired'),
        );
      }
      if (pin.length !== PIN_LENGTH) {
        throw new LoginFieldError('pin', i18n.t('auth:validation.pinLength'));
      }

      await loginWithMobilePin(mobile, pin);
    } catch (err: unknown) {
      if (err instanceof LoginFieldError) {
        throw err;
      }
      // One message for a wrong PIN, a number nobody holds, and a number being
      // throttled — the server does not distinguish them, and telling them
      // apart would say which numbers are worth attacking.
      setError(mapLoginApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
};

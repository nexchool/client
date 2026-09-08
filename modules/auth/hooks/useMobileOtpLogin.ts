import { useState } from 'react';

import i18n from '@/i18n/i18nextInstance';
import { LoginFieldError } from '@/modules/auth/errors/LoginFieldError';
import { mapLoginApiError } from '@/modules/auth/utils/mapLoginApiError';
import { requestMobileOtp } from '@/modules/auth/services/authService';
import { useAuth } from './useAuth';

/** How many digits a code has. Mirrors the server's own constant (`otp.py`). */
export const OTP_LENGTH = 6;

/**
 * Signing in with a code sent to a phone.
 *
 * Two steps, unlike `useMobilePinLogin`'s one: a code has to be asked for
 * before it can be checked. `requestCode` and `verifyCode` are separate so
 * the screen can hold the challenge id returned by the first between the two,
 * without either function needing to know about the other's state.
 *
 * `requestCode` deliberately does not distinguish "a code is on its way" from
 * "there is nobody at that number" — the server answers both the same way
 * (see `otp.py`), and a client that reacted differently to a missing
 * challenge id would defeat the point of that design. It only throws for a
 * validation problem this screen can already see (an empty box), or a
 * genuine request failure (offline, server error) — never for the quiet
 * decline, which is a normal 200 and is treated as success.
 */
export const useMobileOtpLogin = () => {
  const [requestLoading, setRequestLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithMobileOtp } = useAuth();

  const requestCode = async (mobile: string): Promise<string | undefined> => {
    setError(null);
    setRequestLoading(true);

    try {
      if (!mobile?.trim()) {
        throw new LoginFieldError(
          'mobile',
          i18n.t('auth:validation.mobileRequired'),
        );
      }
      const response = await requestMobileOtp({ mobile });
      return response.challenge_id;
    } catch (err: unknown) {
      if (err instanceof LoginFieldError) {
        throw err;
      }
      setError(mapLoginApiError(err));
      throw err;
    } finally {
      setRequestLoading(false);
    }
  };

  const verifyCode = async (
    mobile: string,
    code: string,
    challengeId: string | undefined,
  ) => {
    setError(null);
    setVerifyLoading(true);

    try {
      if (code.length !== OTP_LENGTH) {
        throw new LoginFieldError('code', i18n.t('auth:validation.otpLength'));
      }
      await loginWithMobileOtp(mobile, code, challengeId);
    } catch (err: unknown) {
      if (err instanceof LoginFieldError) {
        throw err;
      }
      // One message for a wrong code, an expired one and a spent one — the
      // server does not distinguish them, and neither should this. Same
      // convention as `useMobilePinLogin`.
      setError(mapLoginApiError(err));
    } finally {
      setVerifyLoading(false);
    }
  };

  return { requestCode, verifyCode, requestLoading, verifyLoading, error };
};

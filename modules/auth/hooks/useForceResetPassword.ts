import { useState } from 'react';
import i18n from '@/i18n/i18nextInstance';
import { forceResetPassword as forceResetPasswordService } from '@/modules/auth/services/authService';

/**
 * Replace the password a school issued, for an account the server is otherwise
 * refusing. Unlike `useResetPassword` there is no token or email to supply —
 * the caller is already signed in, and the session itself is the credential.
 */
export const useForceResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setNewPassword = async (newPassword: string) => {
    setError(null);
    setLoading(true);

    try {
      await forceResetPasswordService({ new_password: newPassword });
    } catch (err: unknown) {
      // The API layer already turns both a rejected body and a dead connection
      // into a readable sentence; the fallback is only for an error with no
      // message at all, which would otherwise leave the screen silent.
      const message = err instanceof Error ? err.message : '';
      setError(message || i18n.t('auth:errors.generic'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { setNewPassword, loading, error };
};

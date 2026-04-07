import { useState } from "react";
import { isValidEmail } from "@/common/utils/validation";
import i18n from "@/i18n/i18nextInstance";
import { LoginFieldError } from "@/modules/auth/errors/LoginFieldError";
import { mapLoginApiError } from "@/modules/auth/utils/mapLoginApiError";
import { useAuth } from "./useAuth";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: authLogin } = useAuth();

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      if (!email?.trim()) {
        throw new LoginFieldError(
          "email",
          i18n.t("auth:validation.emailRequired"),
        );
      }
      if (!isValidEmail(email)) {
        throw new LoginFieldError(
          "email",
          i18n.t("auth:validation.emailInvalid"),
        );
      }
      if (!password) {
        throw new LoginFieldError(
          "password",
          i18n.t("auth:validation.passwordRequired"),
        );
      }

      await authLogin(email, password);
    } catch (err: unknown) {
      if (err instanceof LoginFieldError) {
        throw err;
      }
      setError(mapLoginApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

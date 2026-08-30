import { apiPost } from '@/common/services/api';
import { API_ENDPOINTS } from '@/common/constants/api';

export interface TenantChoice {
  id: string;
  name: string;
  subdomain: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  tenant_id?: string;
  subdomain?: string;
  /** School / organization display name for the current tenant */
  tenant_name?: string | null;
  user?: {
    id: number;
    email: string;
    name: string;
    email_verified: boolean;
    profile_picture_url?: string;
  };
  permissions?: string[];
  /** Plan-enabled feature keys for this tenant (e.g. ['attendance', 'fees_management']). Used to hide/disable UI and APIs. */
  enabled_features?: string[];
  /** When same email exists in multiple schools; app should show school picker then call login with tenant_id */
  requires_tenant_choice?: boolean;
  tenants?: TenantChoice[];
  /**
   * The account is holding a password its school issued and must replace it.
   * While set, the server refuses every endpoint outside the password-reset
   * allowlist, so the app has to send the user to `(auth)/set-password`
   * instead of home.
   */
  force_password_reset?: boolean;
}

export interface MessageResponse {
  message: string;
}

export const login = (data: {
  email: string;
  password: string;
  tenant_id?: string;
  subdomain?: string;
}) => {
  return apiPost<LoginResponse>(API_ENDPOINTS.LOGIN, data);
};

export const forgotPassword = (data: { email: string }) => {
  return apiPost<MessageResponse>(API_ENDPOINTS.FORGOT_PASSWORD, data);
};

export const resetPassword = (data: {
  email: string;
  token: string;
  new_password: string;
}) => {
  return apiPost<MessageResponse>(API_ENDPOINTS.RESET_PASSWORD, data);
};

/**
 * Replace a school-issued password and clear the force flag. Needs the current
 * session (the one the server is otherwise refusing) — the refresh token
 * `api.ts` sends on every request is what keeps that session alive while the
 * server revokes the account's others.
 */
export const forceResetPassword = (data: { new_password: string }) => {
  return apiPost<MessageResponse>(API_ENDPOINTS.FORCE_RESET_PASSWORD, data);
};

export interface ChangePasswordResponse {
  revoked_sessions: number;
}

export const changePassword = (data: {
  current_password: string;
  new_password: string;
  revoke_other_sessions?: boolean;
}) => {
  return apiPost<ChangePasswordResponse>(API_ENDPOINTS.CHANGE_PASSWORD, data);
};

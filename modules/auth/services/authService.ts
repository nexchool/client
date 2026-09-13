import { apiDelete, apiPost } from '@/common/services/api';
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

/**
 * Sign in with a mobile number and a PIN.
 *
 * The same endpoint as an email sign-in, with the method named — so the server
 * runs the gates it already has rather than a second copy of them. The PIN
 * travels in the `password` field because that is the field the endpoint uses
 * for a proof, whatever kind of proof it is.
 *
 * `subdomain` exists for the same reason it does on `login` below: a caller
 * who only has a subdomain (the `select-school` step, before any tenant_id
 * exists) still needs the school named *in the body* — `mobile_pin` declares
 * `requires_tenant = True` on the server (`modules/auth/pipeline.py`
 * `AuthenticationRequest.names_a_tenant`), and that check reads the body only,
 * never `X-Tenant-ID` / `X-Tenant-Subdomain`. A header-only attempt is
 * refused before the PIN is even looked at.
 */
export const loginWithMobilePin = (data: {
  mobile: string;
  pin: string;
  tenant_id?: string;
  subdomain?: string;
}) =>
  apiPost<LoginResponse>(API_ENDPOINTS.LOGIN, {
    method: 'mobile_pin',
    identifier: data.mobile,
    password: data.pin,
    ...(data.tenant_id ? { tenant_id: data.tenant_id } : {}),
    ...(data.subdomain ? { subdomain: data.subdomain } : {}),
  });

/**
 * Sign in with a code sent to a phone.
 *
 * The same endpoint as an email sign-in, with the method named — so the
 * server runs every gate it already has (maintenance, policy, lockout,
 * account status, finalization) rather than a second copy of them. The code
 * travels in the `password` field for the same reason the PIN does above: it
 * is the field the endpoint uses for a proof, whatever kind of proof it is.
 *
 * `subdomain`: same reasoning as `loginWithMobilePin` above — `mobile_otp`
 * also declares `requires_tenant = True`, and the pipeline only reads the
 * body for a named school, so a caller with only a subdomain must still put
 * it in the body, not just the header.
 */
export const loginWithMobileOtp = (data: {
  mobile: string;
  code: string;
  challenge_id?: string;
  tenant_id?: string;
  subdomain?: string;
}) =>
  apiPost<LoginResponse>(API_ENDPOINTS.LOGIN, {
    method: 'mobile_otp',
    identifier: data.mobile,
    password: data.code,
    ...(data.challenge_id ? { challenge_id: data.challenge_id } : {}),
    ...(data.tenant_id ? { tenant_id: data.tenant_id } : {}),
    ...(data.subdomain ? { subdomain: data.subdomain } : {}),
  });

/** A code sent to a phone, and how long it is good for. Never the code itself. */
export interface OtpRequestResponse {
  sent: boolean;
  challenge_id?: string;
  expires_at?: string;
}

/**
 * Ask for a sign-in code.
 *
 * Answers the same way whether or not the number belongs to anybody, so a
 * response here means "if that number can sign in, a code is on its way" —
 * never "that number exists". See `otp.py` on the server for why.
 */
export const requestMobileOtp = (data: { mobile: string; tenant_id?: string }) =>
  apiPost<OtpRequestResponse>(API_ENDPOINTS.OTP_REQUEST, {
    mobile: data.mobile,
    ...(data.tenant_id ? { tenant_id: data.tenant_id } : {}),
  });

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

/**
 * Sign out everywhere, this device included.
 *
 * The local `logout()` only clears this phone; a session revoked on the server
 * is what actually locks somebody out of a device they no longer have. Call
 * this first, then `logout()` — if the request fails the caller still signs
 * out locally, because the person asked to be signed out.
 */
export const revokeAllMySessions = () =>
  apiDelete<{ revoked: number }>(`${API_ENDPOINTS.MY_SESSIONS}?keep_current=false`);

export const changePassword = (data: {
  current_password: string;
  new_password: string;
  revoke_other_sessions?: boolean;
}) => {
  return apiPost<ChangePasswordResponse>(API_ENDPOINTS.CHANGE_PASSWORD, data);
};

/**
 * Renewing an expired access token, exactly once no matter who asked.
 *
 * A phone opening a screen fires several requests at once, and when the
 * access token expires they come back 401 together. Without a single flight
 * each one would present the same refresh token, and because refresh tokens
 * now rotate — a token may be spent once — the first would succeed and the
 * rest would look to the server exactly like a stolen token being replayed.
 * The server would end the session, and the student would experience it as
 * being signed out for opening a busy screen.
 *
 * A phone makes this sharper than a browser does, because a connection that
 * drops and returns produces exactly this burst.
 *
 * The refresh call is a bare `fetch` rather than the app's own client, which
 * is not a shortcut: the client retries through *this* function, so routing
 * the refresh through it would be a loop.
 */

import { getApiUrl } from "@/common/constants/api";
import {
  getRefreshToken,
  getTenantId,
  setAccessToken,
  setRefreshToken,
} from "@/common/utils/storage";

let inFlight: Promise<boolean> | null = null;

const performRefresh = async (): Promise<boolean> => {
  const [refreshToken, tenantId] = await Promise.all([
    getRefreshToken(),
    getTenantId(),
  ]);
  if (!refreshToken) return false;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Surface": "student-mobile",
  };
  if (tenantId) headers["X-Tenant-ID"] = tenantId;

  try {
    const response = await fetch(getApiUrl("/api/auth/refresh"), {
      method: "POST",
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) return false;

    const payload = await response.json();
    const next = payload?.data;
    if (!next?.access_token || !next?.refresh_token) return false;

    // Both, always. Storing the access token and dropping its replacement
    // would leave the next renewal presenting a spent token.
    await setAccessToken(next.access_token);
    await setRefreshToken(next.refresh_token);
    return true;
  } catch {
    // A phone losing signal is not a session ending. The caller gives up on
    // this attempt and the next request tries again.
    return false;
  }
};

/** Renew the access token, joining a renewal already under way. */
export const refreshSession = (): Promise<boolean> => {
  if (!inFlight) {
    inFlight = performRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

/**
 * The headers a direct download needs: who is asking, and for which school.
 *
 * A handful of places fetch a PDF straight from `fetch` or
 * `FileSystem.downloadAsync` rather than through the API client, because they
 * want the bytes and not a parsed envelope. They still need the same headers,
 * and — since the client stopped attaching it — they must not send the
 * refresh token. This is that one list, so the next such place copies a
 * decision instead of making one.
 */
export const authHeaders = async (): Promise<Record<string, string>> => {
  const [accessToken, tenantId] = await Promise.all([
    (await import("@/common/utils/storage")).getAccessToken(),
    (await import("@/common/utils/storage")).getTenantId(),
  ]);
  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (tenantId) headers["X-Tenant-ID"] = tenantId;
  return headers;
};

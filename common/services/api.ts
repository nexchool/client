import { API_ENDPOINTS, getApiUrl } from "@/common/constants/api";
import { noteFeatureStamp } from "@/common/services/featureStamp";
import { refreshSession } from "@/common/services/sessionRefresh";
import { notifySessionExpired } from "@/common/services/sessionExpiry";
import {
  PASSWORD_RESET_REQUIRED_ERROR,
  notifyPasswordResetRequired,
} from "@/common/services/passwordResetRequired";
import {
  getAccessToken,
  getTenantId,
  getTenantSubdomain,
  setAccessToken,
} from "@/common/utils/storage";

/**
 * Endpoints where a 401 is an answer, not an expired session.
 *
 * The pre-auth ones — sign in, the password-reset pair, email validation —
 * answer 401 for a wrong password or a stale link, and the caller is not
 * signed in to be signed out of. Changing a password answers 401 when the
 * *current* password is wrong, so reading it as an expiry would sign someone
 * out over a typo. Logout answers 401 when the session has already gone, and
 * the app is on its way to the login screen either way.
 */
const ENDPOINTS_WHERE_401_IS_NOT_EXPIRY: readonly string[] = [
  API_ENDPOINTS.LOGIN,
  API_ENDPOINTS.FORGOT_PASSWORD,
  API_ENDPOINTS.RESET_PASSWORD,
  API_ENDPOINTS.EMAIL_VALIDATE,
  API_ENDPOINTS.CHANGE_PASSWORD,
  API_ENDPOINTS.LOGOUT,
];

export class ApiException extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.data = data;
  }
}

/**
 * Read a 403 body to see whether it is the server demanding a password change,
 * without consuming the body the caller still has to read.
 *
 * Nearly every 403 is "you lack this permission" and stays the calling
 * screen's problem — only the one error value the server reserves for a
 * school-issued password counts, which is why this inspects the body instead
 * of acting on the status alone.
 */
const noteIfPasswordResetRequired = async (response: Response): Promise<void> => {
  if (!response.headers.get("content-type")?.includes("application/json")) return;
  try {
    const body: unknown = await response.clone().json();
    const error = (body as { error?: unknown } | null)?.error;
    if (error === PASSWORD_RESET_REQUIRED_ERROR) {
      notifyPasswordResetRequired();
    }
  } catch {
    // Not JSON after all, or the body could not be cloned. Nothing to read,
    // and the caller's response is untouched either way.
  }
};

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  skipJsonContentType = false,
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  const [accessToken, tenantId, tenantSubdomain] = await Promise.all([
    getAccessToken(),
    getTenantId(),
    getTenantSubdomain(),
  ]);

  const headers: Record<string, string> = skipJsonContentType
    ? { ...(options.headers as Record<string, string>) }
    : {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

  // Which application is calling. Optional: the server records an absent
  // header as "unknown", so a build already on a phone keeps working.
  headers["X-Client-Surface"] = "student-mobile";

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  } else if (tenantSubdomain) {
    // No confirmed tenant yet — only a subdomain the school-selection step
    // (or a not-yet-signed-in baked build) recorded. The server resolves this
    // the same way it resolves the ID header, just one slug lookup further
    // (core/tenant.py `find_tenant`), which is what lets tenant-branding and
    // the sign-in policy work before anyone has a token.
    headers["X-Tenant-Subdomain"] = tenantSubdomain;
  }

  try {
    let response = await fetch(url, { ...options, headers });

    const isExpiryEndpoint = !ENDPOINTS_WHERE_401_IS_NOT_EXPIRY.some((path) =>
      endpoint.startsWith(path),
    );

    // The refresh token no longer rides along with every request. It used to,
    // so that the server could renew in passing; now that a refresh token may
    // be spent only once, sending it on twenty parallel requests is sending
    // it twenty times, and the server cannot tell that from theft. So it is
    // spent in one place, only when a 401 says it is needed, and the request
    // is sent again with the new token.
    //
    // Once, never a loop: if the renewed token is refused too, the session
    // really is over. One choke point for the whole app, because the
    // alternative is every screen deciding for itself what a dead session
    // looks like.
    if (response.status === 401 && isExpiryEndpoint) {
      if (await refreshSession()) {
        const renewed = await getAccessToken();
        if (renewed) headers["Authorization"] = `Bearer ${renewed}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    // Older builds of the API renewed in passing and announced it here. Kept
    // so a phone running against one still picks the new token up.
    const newAccessToken = response.headers.get("X-New-Access-Token");
    if (newAccessToken) {
      await setAccessToken(newAccessToken);
    }

    if (response.status === 401 && isExpiryEndpoint) {
      notifySessionExpired();
    }

    // The same split as the 401 above, one step further in: the session is
    // valid but the server will serve nothing outside the password-reset
    // allowlist until the school-issued password is replaced. That is a state
    // of the session, not of this request, so the auth layer acts on it. The
    // login and profile payloads carry the flag directly and normally get
    // there first; this catches whatever they miss.
    if (response.status === 403) {
      await noteIfPasswordResetRequired(response);
    }

    // Every /api/* response says which module set it was answered under. A
    // change means the super-admin switched something, and the auth layer
    // re-reads the profile — so the drawer drops a module the school no longer
    // has without waiting for the app to be backgrounded and reopened.
    noteFeatureStamp(response.headers.get("X-Feature-Stamp"));

    return response;
  } catch (error: any) {
    throw new ApiException(
      `Cannot connect to server. Please check your network connection.`,
      0,
      { originalError: error.message, url },
    );
  }
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");

  let data: any;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch {
    throw new ApiException("Failed to parse response", response.status);
  }

  // Handle standardized backend response structure: { success, data, message, error }
  // Backend returns success=true for successful operations
  if (data && typeof data === 'object' && 'success' in data) {
    if (data.success) {
      // If data.data exists, use it, otherwise default to empty object
      // We merge the top-level 'message' into the result so consumers can use it (e.g. MessageResponse)
      const resultData = (data.data && typeof data.data === 'object') ? data.data : (data.data !== undefined ? { value: data.data } : {});
      
      if (data.message && typeof resultData === 'object' && !Array.isArray(resultData)) {
        resultData.message = data.message;
      }
      
      return resultData as T;
    } else {
      // Backend returned logic error (success=false)
      throw new ApiException(
        data.message || data.error || 'An error occurred',
        response.status,
        data
      );
    }
  }

  // Fallback for non-standard responses (e.g. from 3rd party or legacy endpoints)
  if (!response.ok) {
    throw new ApiException(
      data?.error || data?.message || "An error occurred",
      response.status,
      data,
    );
  }

  return data as T;
};

export const apiGet = async <T>(endpoint: string): Promise<T> => {
  const response = await apiRequest(endpoint, { method: "GET" });
  return handleResponse<T>(response);
};

/** Binary GET (e.g. authenticated document stream). Does not parse JSON. */
export const apiGetBlob = async (endpoint: string): Promise<Blob> => {
  const response = await apiRequest(endpoint, { method: "GET" }, true);
  if (!response.ok) {
    const text = await response.text();
    throw new ApiException(
      text || `Request failed (${response.status})`,
      response.status
    );
  }
  const ct =
    response.headers.get("content-type")?.split(";")[0]?.trim() ||
    "application/octet-stream";
  const ab = await response.arrayBuffer();
  if (ab.byteLength === 0) {
    return new Blob([], { type: ct });
  }
  return new Blob([ab], { type: ct });
};

/** Raw Response (e.g. for WebView headers debugging). */
export const apiFetchRaw = async (
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> => {
  return apiRequest(endpoint, { method: "GET", ...init }, true);
};

export const apiPost = async <T>(endpoint: string, body?: any): Promise<T> => {
  const response = await apiRequest(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
};

/** POST with FormData (multipart). Omits Content-Type so fetch sets boundary. */
export const apiPostForm = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  const response = await apiRequest(
    endpoint,
    { method: "POST", body: formData },
    true,
  );
  return handleResponse<T>(response);
};

export const apiPut = async <T>(endpoint: string, body?: any): Promise<T> => {
  const response = await apiRequest(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
};

export const apiPatch = async <T>(endpoint: string, body?: any): Promise<T> => {
  const response = await apiRequest(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
};

export const apiDelete = async <T>(endpoint: string, body?: Record<string, unknown>): Promise<T> => {
  const response = await apiRequest(endpoint, {
    method: "DELETE",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
};

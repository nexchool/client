import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAccessToken,
  getRefreshToken,
  getUserData,
  getPermissions,
  getEnabledFeatures,
  setAccessToken,
  setRefreshToken,
  setUserData,
  setPermissions,
  setEnabledFeatures,
  setTenantId,
  clearAuth,
  getTenantName,
  setTenantName,
  deleteTenantName,
  getForcePasswordReset,
  setForcePasswordReset,
  getPushNotificationsPreference,
} from "@/common/utils/storage";
import {
  login as loginService,
  LoginResponse,
  TenantChoice,
} from "@/modules/auth/services/authService";
import { apiGet } from "@/common/services/api";
import {
  registerFeatureChangeHandler,
  resetFeatureStamp,
} from "@/common/services/featureStamp";
import {
  registerSessionExpiredHandler,
  resetSessionExpiry,
} from "@/common/services/sessionExpiry";
import {
  registerPasswordResetRequiredHandler,
  resetPasswordResetRequired,
} from "@/common/services/passwordResetRequired";
import { API_ENDPOINTS } from "@/common/constants/api";
import * as PERMS from "@/modules/permissions/constants/permissions";
import {
  registerDeviceForPushNotifications,
  unregisterDevicePushNotifications,
} from "@/modules/devices/pushRegistration";

/**
 * Min interval (ms) between GET /profile refreshes when app is opened or returns to foreground.
 * Keeps name, photo, permissions, and plan features in sync with server (e.g. admin updated profile on web).
 */
const AUTH_SNAPSHOT_REFRESH_THROTTLE_MS = 60_000;

interface User {
  id: number | string;
  email: string;
  name?: string;
  email_verified?: boolean;
  profile_picture_url?: string;
}

interface AuthContextType {
  user: User | null;
  /** Current school / tenant display name (from login). */
  tenantName: string | null;
  permissions: string[];
  /** Plan-enabled feature keys (e.g. ['attendance', 'fees_management']). Use isFeatureEnabled(key) to gate UI. */
  enabledFeatures: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * The signed-in account is holding a password its school issued and must
   * choose its own. The server enforces this: while it is true every endpoint
   * outside the password-reset allowlist answers 403, so the app must show
   * `(auth)/set-password` rather than any protected screen.
   */
  mustResetPassword: boolean;
  /** After login with email+password only; set when backend returns multiple schools for that email */
  pendingTenantChoice: { tenants: TenantChoice[]; email: string; password: string } | null;
  login: (email: string, password: string) => Promise<void>;
  /** After user picks a school from pendingTenantChoice */
  loginWithTenant: (tenantId: string) => Promise<void>;
  clearPendingTenantChoice: () => void;
  /** Call after the force-reset endpoint succeeds — the session is now unrestricted. */
  clearMustResetPassword: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthData: (data: LoginResponse) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  /** True if the tenant's plan has this feature enabled. Gate nav/screens with this. */
  isFeatureEnabled: (featureKey: string) => boolean;
  /** Merge fields into the current user and persist to storage (e.g. after profile photo upload). */
  updateLocalUser: (partial: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissionsState] = useState<string[]>([]);
  const [enabledFeatures, setEnabledFeaturesState] = useState<string[]>([]);
  const [pendingTenantChoice, setPendingTenantChoice] = useState<{
    tenants: TenantChoice[];
    email: string;
    password: string;
  } | null>(null);
  const [tenantName, setTenantNameState] = useState<string | null>(null);
  const [mustResetPassword, setMustResetPasswordState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastAuthSnapshotRefreshRef = useRef(0);
  const queryClient = useQueryClient();

  // Refresh user + permissions + enabled_features from GET /profile so admin-side edits (name, photo)
  // and plan/permission changes apply after cold start or when returning from background — without re-login.
  useEffect(() => {
    if (!user) return;

    // `force` skips the throttle. The throttle exists because opening the app
    // is a guess that something might have changed; a stamp change is the
    // server telling us it did, and making the user wait out a minute for news
    // we already have would be perverse.
    const refreshAuthSnapshotIfNeeded = async ({ force = false } = {}) => {
      const now = Date.now();
      if (
        !force &&
        lastAuthSnapshotRefreshRef.current > 0 &&
        now - lastAuthSnapshotRefreshRef.current < AUTH_SNAPSHOT_REFRESH_THROTTLE_MS
      ) {
        return;
      }
      try {
        const data = await apiGet<{
          user?: User;
          permissions?: string[];
          enabled_features?: string[];
          force_password_reset?: boolean;
        }>(API_ENDPOINTS.PROFILE);
        lastAuthSnapshotRefreshRef.current = now;
        // A restored session was never revalidated, so this is where the app
        // finds out that the school reset this account's password while it was
        // closed. GET /profile is one of the four endpoints the server still
        // answers for a locked-out account, so this call is made precisely
        // when everything else would fail.
        if (typeof data.force_password_reset === "boolean") {
          await setForcePasswordReset(data.force_password_reset);
          setMustResetPasswordState(data.force_password_reset);
        }
        if (data.user) {
          await setUserData(data.user);
          setUser(data.user);
        }
        if (Array.isArray(data.permissions)) {
          await setPermissions(data.permissions);
          setPermissionsState(data.permissions);
        }
        if (Array.isArray(data.enabled_features)) {
          await setEnabledFeatures(data.enabled_features);
          setEnabledFeaturesState(data.enabled_features);
        }
      } catch {
        // Offline or a transient server error — keep the cached session rather
        // than sign someone out of a working app because a refresh failed.
        // A 401 no longer lands here as "keep going": the HTTP layer has
        // already reported the session as dead and the expiry handler below
        // ends it.
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "active") {
          refreshAuthSnapshotIfNeeded();
        }
      }
    );

    if (AppState.currentState === "active") {
      refreshAuthSnapshotIfNeeded();
    }

    // Coming back to the foreground only helps a user who left. Someone with
    // the app open keeps a module the school no longer has until they do —
    // so the API's per-response stamp covers that case directly.
    const unregisterFeatureChange = registerFeatureChangeHandler(() => {
      void refreshAuthSnapshotIfNeeded({ force: true });
    });

    return () => {
      subscription.remove();
      unregisterFeatureChange();
    };
  }, [user]);

  // `/api/devices/register` is not on the server's password-reset allowlist, so
  // a locked-out account can only spend a 403 on it. Waiting until the password
  // is set costs nothing — this effect re-runs when the flag clears.
  useEffect(() => {
    if (!user || mustResetPassword) return;
    void (async () => {
      const allowed = await getPushNotificationsPreference();
      if (!allowed) return;
      await registerDeviceForPushNotifications().catch(() => {
        /* simulator, permissions denied, or network */
      });
    })();
  }, [user?.id, mustResetPassword]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [
          accessToken,
          refreshToken,
          userData,
          userPermissions,
          storedEnabledFeatures,
          storedTenantName,
          storedMustResetPassword,
        ] = await Promise.all([
          getAccessToken(),
          getRefreshToken(),
          getUserData(),
          getPermissions(),
          getEnabledFeatures(),
          getTenantName(),
          getForcePasswordReset(),
        ]);

        if (accessToken && refreshToken && userData) {
          setUser(userData);
          setPermissionsState(userPermissions || []);
          setEnabledFeaturesState(storedEnabledFeatures || []);
          setTenantNameState(storedTenantName);
          // Restored before the first protected screen renders, so a flagged
          // account is redirected rather than dropped into a home screen whose
          // every request the server refuses. The profile refresh above then
          // corrects it in either direction.
          setMustResetPasswordState(storedMustResetPassword);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setAuthData = async (data: LoginResponse) => {
    if (!data.access_token || !data.refresh_token || !data.user) return;
    const features = data.enabled_features ?? [];
    // Absent means unrestricted: only a school that issued this password says so.
    const mustReset = data.force_password_reset ?? false;
    const tasks: Promise<void>[] = [
      setAccessToken(data.access_token),
      setRefreshToken(data.refresh_token),
      setUserData(data.user),
      setPermissions(data.permissions || []),
      setEnabledFeatures(features),
      setForcePasswordReset(mustReset),
    ];
    if (data.tenant_id) {
      tasks.push(setTenantId(data.tenant_id));
    }
    if (data.tenant_name) {
      tasks.push(setTenantName(data.tenant_name));
    } else {
      tasks.push(deleteTenantName());
    }
    await Promise.all(tasks);
    // Drop any prior tenant's cached queries so a new session never reads cross-tenant data
    // (queryKeys here are not tenant-scoped; isolation relies on clearing on session change).
    queryClient.clear();
    // A fresh session re-arms the one-shot expiry signal, so the *next* token
    // to die is acted on rather than treated as already handled. Same for the
    // password-reset signal: this session may be a different account.
    resetSessionExpiry();
    resetPasswordResetRequired();
    setUser(data.user);
    setMustResetPasswordState(mustReset);
    setTenantNameState(data.tenant_name ?? null);
    setPermissionsState(data.permissions || []);
    setEnabledFeaturesState(features);
    // Avoid redundant GET /profile right after login (response already has fresh user + features)
    lastAuthSnapshotRefreshRef.current = Date.now();
  };

  const login = async (email: string, password: string) => {
    setPendingTenantChoice(null);
    const response = await loginService({ email, password });
    if (response.requires_tenant_choice && response.tenants?.length) {
      setPendingTenantChoice({
        tenants: response.tenants,
        email,
        password,
      });
      return;
    }
    await setAuthData(response);
  };

  const loginWithTenant = async (tenantId: string) => {
    if (!pendingTenantChoice) return;
    const { email, password } = pendingTenantChoice;
    setPendingTenantChoice(null);
    const response = await loginService({ email, password, tenant_id: tenantId });
    await setAuthData(response);
  };

  const clearPendingTenantChoice = () => setPendingTenantChoice(null);

  /**
   * Forget the demand once the server has honoured it.
   *
   * Read locally rather than by re-reading the profile: the snapshot refresh is
   * throttled to a minute and login has just reset that clock, so asking the
   * server would leave the user staring at the set-password screen they have
   * already completed.
   */
  const clearMustResetPassword = async () => {
    await setForcePasswordReset(false);
    resetPasswordResetRequired();
    setMustResetPasswordState(false);
  };

  const updateLocalUser = async (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...partial };
      void setUserData(merged);
      return merged;
    });
  };

  /** Forget the current session locally. Shared by sign-out and expiry. */
  const clearSession = async () => {
    await clearAuth();
    queryClient.clear();
    // The next school has its own module set; carrying this one's stamp over
    // would read as a change and refresh a profile that was already fresh.
    resetFeatureStamp();
    resetPasswordResetRequired();
    setUser(null);
    setTenantNameState(null);
    setPermissionsState([]);
    setEnabledFeaturesState([]);
    setMustResetPasswordState(false);
  };

  const logout = async () => {
    // `/api/devices/unregister` is not on the server's password-reset
    // allowlist, so a locked-out account can only spend a 403 on it — and that
    // 403 would route back to set-password mid-sign-out, fighting the very
    // navigation this call precedes. Same reasoning as the expiry handler
    // below, which skips it for a token the server has already refused.
    if (!mustResetPassword) {
      await unregisterDevicePushNotifications().catch(() => {});
    }
    await clearSession();
  };

  // The HTTP layer can see a rejected session but cannot decide what one
  // means; that is this layer's job. Without it an expired token left the app
  // looking signed in and behaving broken — every screen failing to load, with
  // signing out by hand the only way forward.
  //
  // No push de-registration here, unlike `logout`: the token that call would
  // authenticate with is the one the server just refused.
  useEffect(() => {
    return registerSessionExpiredHandler(() => {
      void (async () => {
        await clearSession();
        router.replace("/(auth)/login");
      })();
    });
    // `clearSession` only touches values that are stable across renders (the
    // state setters and the query client), so one registration for the
    // provider's lifetime is correct — and re-registering per render would
    // race the unsubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backstop for the two payload reads above. Any request that gets the
  // server's refusal proves the flag is set, whatever the app currently
  // believes — so record it and move, rather than leaving the user on a screen
  // that will never load. Unlike an expired session this is not a sign-out:
  // the token is good, and it is the one the set-password screen needs.
  useEffect(() => {
    return registerPasswordResetRequiredHandler(() => {
      void (async () => {
        await setForcePasswordReset(true);
        setMustResetPasswordState(true);
        router.replace("/(auth)/set-password");
      })();
    });
    // Registered once for the provider's lifetime: the body closes over
    // nothing that changes between renders, and re-registering per render
    // would race the unsubscribe.
  }, []);

  /**
   * Whether the school runs this module.
   *
   * This used to answer `true` to everything when the list came back empty,
   * which unlocked every module for any tenant whose list arrived empty for
   * any reason. It cannot: the server resolves core features to `true` before
   * building the list (`core/feature_flags.py`), so a real school's list is
   * never shorter than the core set — on login and on every profile refresh
   * alike. An empty list is therefore not a school with nothing switched on.
   *
   * It has exactly one legitimate cause. Platform admins are sent no feature
   * list at all and `system.manage` in its place, deliberately, because plan
   * gating is not applied to them. So an empty list plus that permission is
   * god-mode and stays open; an empty list without it is a list we failed to
   * get, and is answered "no" rather than "yes to everything".
   *
   * Nothing reads this during the cold-start window when both lists are
   * briefly empty — the root and protected layouts render nothing until
   * `isLoading` clears.
   */
  const isFeatureEnabled = (featureKey: string): boolean => {
    if (enabledFeatures.length > 0) return enabledFeatures.includes(featureKey);
    return permissions.includes(PERMS.SYSTEM_MANAGE);
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!permissions || permissions.length === 0) return false;

    // Check for exact permission
    if (permissions.includes(permission)) return true;

    // Check for hierarchical manage permission
    // e.g., if checking "attendance.mark" and user has "attendance.manage"
    const resource = permission.split(".")[0];
    const managePermission = `${resource}.manage`;
    if (permissions.includes(managePermission)) return true;

    // Check for system.manage (super admin)
    if (permissions.includes("system.manage")) return true;

    return false;
  };

  // Check if user has any of the provided permissions
  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some((perm) => hasPermission(perm));
  };

  // Check if user has all of the provided permissions
  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every((perm) => hasPermission(perm));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenantName,
        permissions,
        enabledFeatures,
        isAuthenticated: !!user,
        isLoading,
        mustResetPassword,
        pendingTenantChoice,
        login,
        loginWithTenant,
        clearPendingTenantChoice,
        clearMustResetPassword,
        logout,
        setAuthData,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isFeatureEnabled,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

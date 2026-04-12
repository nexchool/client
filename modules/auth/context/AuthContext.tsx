import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { AppState, AppStateStatus } from "react-native";
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
  getPushNotificationsPreference,
} from "@/common/utils/storage";
import {
  login as loginService,
  LoginResponse,
  TenantChoice,
} from "@/modules/auth/services/authService";
import { apiGet } from "@/common/services/api";
import { API_ENDPOINTS } from "@/common/constants/api";
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
  /** After login with email+password only; set when backend returns multiple schools for that email */
  pendingTenantChoice: { tenants: TenantChoice[]; email: string; password: string } | null;
  login: (email: string, password: string) => Promise<void>;
  /** After user picks a school from pendingTenantChoice */
  loginWithTenant: (tenantId: string) => Promise<void>;
  clearPendingTenantChoice: () => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const lastAuthSnapshotRefreshRef = useRef(0);

  // Refresh user + permissions + enabled_features from GET /profile so admin-side edits (name, photo)
  // and plan/permission changes apply after cold start or when returning from background — without re-login.
  useEffect(() => {
    if (!user) return;

    const refreshAuthSnapshotIfNeeded = async () => {
      const now = Date.now();
      if (
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
        }>(API_ENDPOINTS.PROFILE);
        lastAuthSnapshotRefreshRef.current = now;
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
        // Offline, 401, etc. — keep cached session
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

    return () => subscription.remove();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const allowed = await getPushNotificationsPreference();
      if (!allowed) return;
      await registerDeviceForPushNotifications().catch(() => {
        /* simulator, permissions denied, or network */
      });
    })();
  }, [user?.id]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [accessToken, refreshToken, userData, userPermissions, storedEnabledFeatures, storedTenantName] =
          await Promise.all([
            getAccessToken(),
            getRefreshToken(),
            getUserData(),
            getPermissions(),
            getEnabledFeatures(),
            getTenantName(),
          ]);

        if (accessToken && refreshToken && userData) {
          setUser(userData);
          setPermissionsState(userPermissions || []);
          setEnabledFeaturesState(storedEnabledFeatures || []);
          setTenantNameState(storedTenantName);
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
    const tasks: Promise<void>[] = [
      setAccessToken(data.access_token),
      setRefreshToken(data.refresh_token),
      setUserData(data.user),
      setPermissions(data.permissions || []),
      setEnabledFeatures(features),
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
    setUser(data.user);
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

  const updateLocalUser = async (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...partial };
      void setUserData(merged);
      return merged;
    });
  };

  const logout = async () => {
    await unregisterDevicePushNotifications().catch(() => {});
    await clearAuth();
    setUser(null);
    setTenantNameState(null);
    setPermissionsState([]);
    setEnabledFeaturesState([]);
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    if (!enabledFeatures || enabledFeatures.length === 0) return true;
    return enabledFeatures.includes(featureKey);
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
        pendingTenantChoice,
        login,
        loginWithTenant,
        clearPendingTenantChoice,
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

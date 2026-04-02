import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getProductionApiBaseUrl } from '@/config/appConfig';

const isDev = __DEV__;

/** Production backend URL (release builds: from Expo extra via app.config; fallback env). */
const PROD_URL = getProductionApiBaseUrl();

/** Development backend URL - from env or built from IP+port */
const getDevUrl = (): string => {
  const devUrl = process.env.EXPO_PUBLIC_BACKEND_URL_DEV;
  if (devUrl) return devUrl;

  const devIp = process.env.EXPO_PUBLIC_LOCAL_IP;
  const devPort = process.env.EXPO_PUBLIC_DEV_PORT ?? '5001';
  const isPhysicalDevice = Constants.isDevice;

  // iOS Simulator can use localhost
  if (Platform.OS === 'ios' && !isPhysicalDevice) {
    return `http://localhost:${devPort}`;
  }

  // Physical devices and Android emulator need the machine's IP
  if (devIp) return `http://${devIp}:${devPort}`;

  // Fallback to prod URL if no dev config (e.g. testing prod from dev build)
  return PROD_URL;
};

export const API_BASE_URL = isDev ? getDevUrl() : PROD_URL;

/** Current environment: 'development' | 'production' */
export const API_ENV = isDev ? 'development' : 'production';

export const API_ENDPOINTS = {
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  FORGOT_PASSWORD: '/api/auth/password/forgot',
  RESET_PASSWORD: '/api/auth/password/reset',
  EMAIL_VALIDATE: '/api/auth/email/validate',
  PROTECTED: '/api/protected',
  /** Lightweight: returns only { enabled_features }. Use on app focus to reflect plan changes. */
  ENABLED_FEATURES: '/api/auth/enabled-features',
} as const;

/**
 * Join API base URL with an endpoint path.
 * If the base already ends with `/api` and the path starts with `/api/`, the duplicate
 * `/api` segment is dropped so we never request `/api/api/...` (Flask returns 404 "Resource not found").
 */
export const getApiUrl = (endpoint: string): string => {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (base.endsWith("/api") && path.startsWith("/api")) {
    const rest = path.replace(/^\/api/, "") || "/";
    return `${base}${rest}`;
  }
  return `${base}${path}`;
};

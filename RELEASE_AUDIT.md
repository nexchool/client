# Release audit — Nexchool (Expo client)

**Date:** 2026-04-01  
**Scope:** `client/` (React Native / Expo mobile app)

## Configuration

| Item | Finding |
|------|---------|
| **App config** | Migrated from `app.json` to **`app.config.ts`** for typed config, `extra`, and EAS Updates URL. |
| **Navigation** | **Expo Router** (`expo-router`, `main`: `expo-router/entry`). File-based routes under `app/`. |
| **React Navigation** | Present as dependencies (tabs, native stack) for nested navigators; primary shell is Expo Router. |
| **Language** | **TypeScript** (`tsconfig.json`, strict). |
| **expo-updates** | **Added** (`~29.0.16`, SDK 54–compatible). Plugin listed in `app.config.ts`. |
| **eas.json** | **Present** — extended with `development` / `preview` / `production` channels, AAB for production Android, submit track `internal`. |
| **Environment variables** | Prior pattern: **`EXPO_PUBLIC_*`** at bundle time (`EXPO_PUBLIC_BACKEND_URL`, dev helpers). EAS `env` per profile injects production URL for release builds. |
| **API base URL** | Previously centralized in **`common/constants/api.ts`** (`API_BASE_URL` / `getApiUrl`). Now **`getProductionApiBaseUrl()`** in **`config/appConfig.ts`** reads `expo.extra.apiBaseUrl` (from `app.config.ts`) with fallback to `EXPO_PUBLIC_BACKEND_URL`. |

## Assets

- **Icon / splash / adaptive icon:** unchanged paths (`./assets/icon.png`, `./assets/splash-icon.png`, `./assets/adaptive-icon.png`).

## Identifiers (post-change)

- **Android package:** `in.nexchool.app`
- **Expo project slug:** `school-erp` (must match the linked `extra.eas.projectId` on expo.dev). **Product / store name** remains **Nexchool** (`name`, scheme `nexchool`, package `in.nexchool.app`).
- **Display name:** `Nexchool`
- **Deep link scheme:** `nexchool` (was `schoolerp`)

## Notes

- Monorepo contains other packages (`server`, `admin-web`, `panel`, `landing-page`); CI for mobile targets **`client/`** only.
- Pre-existing TypeScript errors exist in other screens (unrelated to release plumbing); release-related files lint clean.

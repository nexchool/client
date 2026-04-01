# Nexchool — Play Store & EAS release guide

Short, practical steps for the project owner. The Expo app lives in **`client/`**.

---

## A) One-time setup (outside the repo)

### Google Play Console

1. Create a **new app** (package **`in.nexchool.app`** — must match `app.config.ts`; a new package id is a **new** Play app listing).
2. Complete **store listing** basics: short/full description, screenshots, feature graphic, privacy policy URL, content rating questionnaire, target audience.
3. **App signing:** use **Play App Signing** (recommended). EAS Submit can upload AABs; Google holds the signing key.
4. **Internal testing:** create an internal testing track, upload the first build (manual or via EAS Submit), add testers by email or Google Group.

### Expo / EAS

1. Install EAS CLI: `npm install -g eas-cli`.
2. Log in: `eas login` (account that owns the Expo project).
3. **Expo project slug vs app name:** The linked Expo project uses slug **`school-erp`** (dashboard URL). `app.config.ts` **`slug`** must match that project. The **app display name** is still **Nexchool** (`name`), with scheme **`nexchool`** and Play package **`in.nexchool.app`**. To use Expo slug **`nexchool`** instead, create a **new** Expo project with that slug, replace **`extra.eas.projectId`** in `app.config.ts`, and set **`slug: "nexchool"`**.
4. **Android signing (first time):** EAS cannot **generate a new keystore** while **`--non-interactive`** is set. Run the **first** production Android build **without** `--non-interactive` so you can confirm prompts (or run `eas credentials -p android` and let EAS create a keystore). After credentials exist on Expo’s servers, **`--non-interactive`** and GitHub Actions builds work. Prefer **EAS-managed** keystore unless you upload your own.
5. **EXPO_TOKEN** (for CI): Expo dashboard → **Account settings → Access tokens** → create a token. Add **`EXPO_TOKEN`** as a **GitHub repository secret** (same name).

### GitHub

- Ensure workflows in `.github/workflows/` run on this repo; **`EXPO_TOKEN`** secret must be set for OTA and store jobs.

---

## B) Commands (local)

From repository root:

```bash
cd client
npm install
```

**EAS:**

```bash
eas login
eas build:configure
eas update:configure
```

**Production Android build (AAB, Play Store) — first time (interactive; creates keystore if needed):**

```bash
eas build --platform android --profile production
```

**Same build, non-interactive (only after Android credentials exist on Expo):**

```bash
eas build --platform android --profile production --non-interactive
```

**With auto-submit to Internal track (after Play app + credentials exist):**

```bash
eas build --platform android --profile production --auto-submit --non-interactive
```

**OTA (production channel):**

```bash
eas update --channel production --message "Your release notes" --non-interactive
```

---

## C) When to use OTA vs store release

| Use | When |
|-----|------|
| **OTA (`eas update`)** | JS/asset-only fixes; no native code or dependency changes; same **`runtimeVersion`** policy (`appVersion` — must match **`expo.version`** for the binary users have). |
| **Full store build** | Native modules changed, Expo SDK upgrade, `versionCode` / permissions / package name changes, or anything requiring a new binary. |

---

## D) Versioning

| Field | When to bump |
|-------|----------------|
| **`expo.version`** (`app.config.ts`, keep in sync with `client/package.json` if you mirror) | User-visible **version name**; bump for meaningful releases; must align with **`runtimeVersion`** policy `appVersion` for OTA compatibility. |
| **`android.versionCode`** (`app.config.ts`) | **Every** new upload to Play (monotonic integer). |

After edits, commit and rebuild for store; for OTA-only, bump `expo.version` when you ship a binary that should only accept matching updates (policy `appVersion`).

---

## E) Pre-rollout checklist

- [ ] `EXPO_PUBLIC_BACKEND_URL` / `eas.json` `env` points to **production** API.
- [ ] Smoke test **login**, tenant header behavior, and one critical flow on a **release** build (not only Expo Go).
- [ ] Confirm **EAS channel** (`production`) matches the build you distributed.
- [ ] For store: **versionCode** incremented; AAB builds successfully.
- [ ] Privacy policy and Play **Data safety** section match app behavior.

---

## GitHub Actions triggers

- **OTA:** push to `main` with **`[ota]`** in the commit message, or run workflow manually.
- **Store:** push to `main` with **`[store-release]`** in the commit message, or run workflow manually.

Commit message must contain the tag (e.g. `fix(auth): token refresh [ota]`).

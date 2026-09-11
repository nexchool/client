# Nexchool — Play Store & EAS release guide

How a change on your machine becomes an app on someone's phone. The Expo app
lives in `client/`, which is its own git repository (`nexchool/client`).

---

## The short version

| You want to ship | Do this | Takes |
|---|---|---|
| A JS / styling / logic fix | Push to `main` | ~1 min, automatic |
| A new native dependency, SDK bump, permission, icon, or app name | Push to `main` with `[store-release]` in the commit message | ~20 min + Play processing |

Everything else below explains why, and what to do when it breaks.

---

## Two speeds, and why

The app ships `expo-updates`, so most changes never need a new binary. A JS
bundle can be swapped on a phone that already has the app — that is an **OTA
update**, and it is the loop to stay in while fixing bugs.

A **store release** rebuilds and re-signs the whole binary. You need one when
the JS bundle is no longer enough:

- a new dependency with native code
- an Expo SDK upgrade
- a change to app permissions
- a change to `android.package`, the app name, or the icon
- a change to `expo.version`

Shipping an OTA when you needed a store build gives people JS written against
native code their binary does not contain. The workflows keep these apart: a
commit tagged `[store-release]` skips the OTA job on purpose.

---

## Where the configuration lives

### Build-time environment → **EAS environment variables** (not this repo)

The API URL and the baked tenant are stored on EAS servers, per environment,
so that `eas build` and `eas update` cannot drift apart.

```bash
eas env:list production          # see what a production build will bake in
eas env:set production --name EXPO_PUBLIC_BACKEND_URL --value https://api.nexchool.in
```

Currently set for both `production` and `preview`:

| Variable | Value | Effect |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | `https://api.nexchool.in` | `extra.apiBaseUrl` — every API call |
| `EXPO_PUBLIC_APP_ENV` | `production` / `preview` | `extra.environment` |
| `EXPO_PUBLIC_TENANT_SUBDOMAIN` | `default` | The school this build *is* |

`eas.json` deliberately contains **no** `env` blocks. Each build profile names
an `environment` instead. If you add a value to one place and not the other,
an OTA update will quietly ship different settings than the binary it lands
on — which is exactly the bug this arrangement removes.

### Local development → `client/.env`

Not used by EAS builds (it is gitignored and never uploaded). See
`.env.example`.

---

## Baked tenants, and per-school builds

A build can know which school it belongs to before anyone signs in. Set
either identifier:

- `EXPO_PUBLIC_TENANT_SUBDOMAIN` — the slug, e.g. `default`. **Prefer this.**
- `EXPO_PUBLIC_TENANT_ID` — the tenant UUID.

Either one alone is enough: the app sends `X-Tenant-ID` when it has an id and
`X-Tenant-Subdomain` otherwise, and the server resolves both
(`server/core/tenant.py`). The slug wins on readability — you can check it by
eye, where a mistyped UUID silently points a school's app at another school.

On first launch `seedBakedTenant` copies the baked value into storage, the
school-selection screen is skipped, and `useTenantTheme` fetches that school's
branding. A build with neither variable set is the general app and shows
school selection instead.

**To ship a school its own listing** (a separate Play app), set these in a new
EAS environment and build against it:

```
EXPO_PUBLIC_TENANT_SUBDOMAIN = stjosephs
EXPO_PUBLIC_APP_NAME         = St Josephs
EXPO_PUBLIC_APP_SLUG         = stjosephs
EXPO_PUBLIC_APP_ICON         = ./assets/schools/stjosephs-icon.png
EXPO_PUBLIC_APP_SCHEME       = stjosephs
EXPO_PUBLIC_ANDROID_PACKAGE  = in.nexchool.stjosephs
```

A new `android.package` is a **new** Play listing with its own store page,
screenshots and reviews. It is also permanent — it cannot be changed once a
build is uploaded.

---

## Versioning

| Field | Who owns it | When it changes |
|---|---|---|
| `expo.version` (`app.config.ts`) | You, by hand | Meaningful releases. Also the `runtimeVersion` (policy `appVersion`), so **changing it means existing phones stop receiving OTA updates** until they install the new binary. |
| Android `versionCode` | EAS, automatically | Every build. `appVersionSource: "remote"` + `autoIncrement` keeps the counter on EAS servers. |

Do **not** put `versionCode` in `app.config.ts`. A dynamic config cannot be
written back to, so a pinned value means every build ships the same number and
Play rejects the second upload.

---

## One-time setup (already done, for reference)

- **EAS project:** `@nexchool/nexchool` (`e2702f4e-9aa0-4063-be88-bb9ee5853ee6`)
- **Android keystore:** held by EAS. Never regenerate it — a different signing
  key means Play refuses the upload and the only fix is a new listing.
- **`EXPO_TOKEN`:** a GitHub Actions secret on `nexchool/client`. Created at
  expo.dev → Account settings → Access tokens (personal account, not the org
  page — the org has robot users instead).
- **Google Play service account:** needed for `--auto-submit`. Play Console →
  Developer account → API access → create a service account, grant it release
  access, then `eas credentials -p android` → Google Service Account → upload
  the JSON.

---

## Troubleshooting

**`Some specified paths were not resolved, unable to cache dependencies`**
`package-lock.json` is missing from the repository. It must be committed —
`npm ci` cannot run without it.

**`Version code N has already been used`**
Play already has that number. EAS's remote counter is behind what was uploaded
by hand. Fix it on the EAS dashboard (project → Android → version code) rather
than in this repo.

**The first `eas submit` for a brand-new app fails**
Google's API often refuses the first upload for an app that has never had one.
Download the AAB from the EAS build page and upload it through Play Console
once; every run after that works.

**An OTA update did nothing**
Check that `expo.version` still matches the binary people have — the
`appVersion` runtime policy will not deliver an update across a version bump.

**The app opens on the school-selection screen when it should not**
`EXPO_PUBLIC_TENANT_SUBDOMAIN` was not set for that environment. Confirm with
`eas env:list production`. Note that reinstalling is the only way to clear an
already-stored tenant — `seedBakedTenant` will not overwrite one, by design.

---

## Play Console notes (personal developer account)

This account is registered as **personal**, not as an organisation, which
brings one hard requirement:

- **Internal testing** — up to 100 testers by email, available in minutes.
  No extra requirements. This is the right track for client demos.
- **Production** — requires a closed test with **at least 12 testers opted in
  continuously for 14 days**, and then an application for production access.
  The clock starts only once 12 people have actually joined.

`submit.production.android.track` in `eas.json` is set to `internal`. Promote
a release to closed or open testing from the Play Console UI.

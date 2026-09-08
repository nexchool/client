# Biometric Unlock — how it works, what it does not do, and what is left

**Shipped:** 2026-09-08 · **Scope:** `client` only · **Requires a store release** (see §4)

---

## 1. What it is

Face ID or a fingerprint stands in front of a session that is **already on this
phone**, and nothing else.

When the app cold-starts, `AuthContext` restores a session from secure storage
without asking the server or the person anything — that is what has always made
the app open straight to the home screen. If the person has switched biometric
unlock on, that restore now raises a gate instead: `SessionGate` in
`app/_layout.tsx` renders `LockScreen` **in place of the router itself** until
the phone confirms its owner is present.

Above the router, not inside a route group — and that placement is the whole
correctness argument. See §2.

```
cold start
   │
   ├─ storage has tokens? ──no──▶ (auth)/login
   │            yes
   ├─ biometric unlock on? ──no──▶ home
   │            yes
   └─ LockScreen ──Face ID / fingerprint / device passcode──▶ home
                 └─ "Sign in with your password instead" ──▶ sign out ──▶ login
```

**It is not an authentication method.** The server never learns that biometry
happened. No strategy is registered, no identifier or credential exists for it,
and `tenant_auth_policy_rules` is untouched. The first sign-in on any device is
still email, admission ID, or mobile — biometry only shortens the *return*.

**No biometric data leaves the phone, ever.** The app never sees a fingerprint
or a face; it asks the operating system a yes/no question and is told the
answer. This matters commercially as well as technically: a school asking what
Nexchool does with children's biometrics has a short and true answer — nothing,
because it never receives any.

### Where the code is

| Concern | File |
|---|---|
| Can this phone do it, and what is it called | `modules/auth/biometrics/capability.ts` |
| Asking the phone for its owner | `modules/auth/biometrics/unlock.ts` |
| The Settings switch's state machine | `modules/auth/biometrics/useBiometricUnlockSetting.ts` |
| The gate itself | `modules/auth/components/LockScreen.tsx` |
| Where the gate is applied | `app/_layout.tsx` (`SessionGate`) |
| The one-time offer after sign-in | `modules/auth/components/BiometricUnlockOffer.tsx` |
| The Settings row | `modules/auth/components/BiometricUnlockRow.tsx` |
| `isLocked`, and the restore that raises it | `modules/auth/context/AuthContext.tsx` |
| The stored preference | `common/utils/storage.ts` |

---

## 2. Rules the implementation keeps

- **Opt-in, never default.** Offered once after a sign-in, plus a permanent
  switch in Settings.
- **Turning it on requires passing the prompt right then.** A promise about the
  next cold start must not be made on a phone where the prompt does not work.
- **The device passcode stays available** (`disableDeviceFallback: false`).
  Removing a fingerprint degrades to a passcode prompt rather than stranding
  somebody outside their own session.
- **It fails closed.** A cancelled, failed, or impossible prompt leaves the gate
  up. There is no path from a locked app to a protected screen except passing
  the prompt or signing out.
- **Cleared on sign-out.** The preference belongs to a person on a phone, not to
  the phone. The next person to sign in gets their own offer.
- **Nothing renders behind it, and no route escapes it.** `SessionGate` wraps
  the `Stack`, so the gate covers every route rather than one group.

  This was got wrong first, and the mistake is worth keeping written down. The
  gate originally lived in `app/(protected)/_layout.tsx`, which looks like the
  right place — it is where "you must be signed in" is enforced. But a forced
  password change redirects to `(auth)/set-password`, **outside** that group,
  so the gate was never rendered for an account in that state. And forced reset
  takes only a new password — "the caller is already signed in, and the session
  itself is the credential" (`useForceResetPassword`). So an administrator
  resetting somebody's password silently turned their locked phone into an
  unlocked one: whoever held it could set a new password and walk straight in,
  having passed no prompt at all.

  A gate that covers some routes is not a gate. Anything added later that can
  render a screen for a signed-in person — a new route group, an onboarding
  step, a maintenance interstitial — belongs *inside* `SessionGate`, never
  beside it.

---

## 3. Drawbacks — iOS

**These are honest limits, not bugs to be fixed later.**

1. **Face ID has no idea *whose* face it is.** It authenticates the device's
   enrolled set, not the account holder. On a phone shared between a parent and
   a child — routine in this product's market — either person's face opens
   whichever account is signed in. **Never describe this to a school as proof of
   who was present.** It shortens a return; it does not identify anybody.
2. **A missing purpose string kills the app.** An iOS app that reaches Face ID
   with no `NSFaceIDUsageDescription` is terminated by the system on the spot —
   not a denial, a crash. It is set by the `expo-local-authentication` plugin
   entry in `app.config.ts`, and `ios/` is gitignored and regenerated by
   prebuild, so **that file is the only place it survives**. The same trap is
   already documented one entry above it for `expo-image-picker`.
3. **App Review rejects generic purpose strings.** Ours says what the prompt
   actually unlocks. If it is ever shortened to "Allow Nexchool to use Face ID",
   expect a rejection.
4. **The OS prompt briefly backgrounds the app.** Harmless at cold start, and it
   is precisely why re-lock-on-foreground is future work rather than part of
   this change (§5, F1) — done naively, the prompt backgrounds the app, which
   re-locks it, which prompts again.
5. **No passcode, no feature.** `authenticateAsync` fails outright on a device
   with neither biometrics nor a passcode. The Settings row hides itself rather
   than offering a control that cannot succeed.
6. **The simulator looks broken when it is not.** Face ID must be enrolled by
   hand (Features → Face ID → Enrolled) and matched deliberately (Features →
   Face ID → Matching Face). A "broken build" is usually an unenrolled
   simulator.
7. **`biometryCurrentSet` invalidation** — not a limit today, but the reason the
   rejected design in §5/F2 is future work rather than current: keychain items
   written with `requireAuthentication` are permanently invalidated when the
   enrolled set changes, and a person adding a second fingerprint would
   experience that as an unexplained sign-out.

### Drawbacks — Android

- `BiometricPrompt` locks out for 30 seconds after five failures, and until the
  device is unlocked after more. `LockScreen` reads that as `'unavailable'` and
  offers the password instead of a button that cannot work.
- `expo-secure-store`'s own prompt has no device-credential fallback
  (`setNegativeButtonText`, no `setAllowedAuthenticators`), which is one more
  reason the gate lives in `expo-local-authentication`.

---

## 4. Release constraints

- **Not OTA-able.** A new native module plus an `Info.plist` entry means a real
  build. Per this repo's CI, a push to `client` `main` fires nothing unless the
  commit message carries `[store-release]` or `[ota]` — and this must be
  `[store-release]`.
- **Not testable in Expo Go.** Needs a development build.
- **Verify on hardware before release.** The simulator can confirm the flow but
  not the OS prompt's real behaviour, and iPad and low-end Android are the two
  places this is most likely to surprise.

---

## 5. Future work

| # | Task | Why it is not here |
|---|---|---|
| F1 | **Re-lock when returning to the foreground** after an idle period, with a privacy screen over the app-switcher snapshot | Needs `AppState` handling that survives the biometric prompt itself backgrounding the app, or it prompt-loops. Its own piece of work, and the one most worth doing next. |
| F2 | **Bind the refresh token to a biometric-gated key** — a random key held behind `requireAuthentication`, read once per process into memory, encrypting the rotating token at rest | Defeats keychain extraction on a rooted or jailbroken device. Blocked on an AES dependency and a migration path for already-stored tokens; also see §3.7. |
| F3 | **`passkey` as a real authentication method** | The server's strategy contract already admits it (identity spec §10.6). Needs a new `account_identifiers` type, relaxation of the one-credential-per-type unique index, and associated-domain files for every white-label package. |
| F4 | **School policy over biometric unlock** | Recorded as debt 63. A device-local convenience is not a login method, and modelling it as one to gain the control would be worse than not having it. |
| F5 | **A test suite for `client`** | There is none — this feature is covered by types, lint and a manual pass, which is weaker than everything it depends on server-side. The biometrics module was written as pure functions with no screen dependencies precisely so it is testable the day a runner exists. |

---

## 6. Not verified on a device

This feature has **never been run**. It was written, typechecked and linted on a
machine with no Xcode and no Android SDK, so no build was possible and no screen
was ever rendered. The design pass below found and fixed one real defect (§2), but
reasoning is not running.

Verify these on hardware before release. They are the three places where reading
the code cannot tell you the answer:

1. **The lock screen renders correctly with the router unmounted.** `SessionGate`
   is the one place in the app that renders a screen while the `Stack` is not
   mounted. `ScreenContainer` uses `SafeAreaView`, and the app has no
   `SafeAreaProvider` of its own — React Navigation supplies one to every other
   screen. `SessionGate` wraps its branch in a `SafeAreaProvider` for exactly
   this reason, but whether the insets come out right on a notched phone and on
   iPad is a thing to look at, not to deduce.
2. **A notification tapped while locked still navigates after unlocking.**
   `useNotificationResponseNavigation` lives inside the `Stack`, which is not
   mounted while locked. The response should still be waiting when it mounts —
   but that is an assumption about `expo-notifications`, not an observation.
3. **A session expiring while locked.** The profile refresh runs behind the lock
   screen, so a dead session can be discovered while the `Stack` is unmounted,
   and the expiry handler calls `router.replace` with no navigator mounted. It
   should be harmless — clearing the session lowers the gate, and the normal
   redirect takes over — but expect a router warning and confirm there is no
   worse behaviour behind it.

Also unverified, and true of the whole flow: the OS prompt itself, the Face ID
purpose string appearing correctly, and Android's `BiometricPrompt` lockout
behaviour.

---

## 7. Related

- `server/docs/architecture/adr/ADR-022-session-lifetime-by-surface.md` — why a
  phone's session now lasts 30 days idle / 90 absolute, which is what makes
  biometric unlock worth having rather than a gate in front of a session that
  expires weekly anyway.
- `docs/superpowers/specs/2026-09-08-session-lifetime-and-biometric-unlock-design.md`
  — the design, including the rejected `requireAuthentication` approach.

# July Update — Build, Crash, Security & Retention Audit

**Date:** 28 July 2026
**Branch:** `master`
**Builds covered:** iOS build 7, 8, 9 (v1.0.0)

---

## Table of contents

1. [Summary](#1-summary)
2. [Security incident: leaked Resend API key](#2-security-incident-leaked-resend-api-key)
3. [Missing environment variables](#3-missing-environment-variables)
4. [The startup crash](#4-the-startup-crash)
5. [Dependency misalignment](#5-dependency-misalignment)
6. [Local environment corruption](#6-local-environment-corruption)
7. [Build & TestFlight pipeline](#7-build--testflight-pipeline)
8. [Onboarding PIN entry bug](#8-onboarding-pin-entry-bug)
9. [Product audit: impact & retention](#9-product-audit-impact--retention)
10. [Outstanding actions](#10-outstanding-actions)

---

## 1. Summary

Three iOS builds were produced. Build 7 reached TestFlight but crashed on launch.
Build 8 fixed missing backend credentials but still crashed. Build 9 aligned 15
mismatched dependencies, which is the current best candidate fix.

Along the way, a **publicly exposed API key** was found in the repository, and a
product audit surfaced several retention systems that are built but never
switched on.

| Area | Status |
|---|---|
| Supabase credentials in builds | Fixed (build 8+) |
| Dependency alignment | Fixed (build 9) |
| Startup crash | Fix shipped in build 9, **unverified on device** |
| Resend API key exposure | Removed from code, **key still needs rotating** |
| `RESEND_API_KEY` in Supabase | **Not set — email is broken** |
| PIN entry (login + onboarding) | Rebuilt as a shared component, **untested on device** |
| Auth guard on protected routes | **Was entirely absent** — now added |

---

## 2. Security incident: leaked Resend API key

### What happened

The Resend API key `re_N7EV6471_...` was committed in plaintext in **three tracked
files**, present since the initial commit `3eb55d5`:

- `EMAIL_INTEGRATION.md` (line 91, documented as a literal value)
- `test-email.js` (line 4)
- `test-branded-email.js` (line 4)

The repository `github.com/familyforge/app` is **public** (`"private": false`
confirmed via the GitHub API). The key has therefore been publicly readable for
the entire life of the repo.

### Impact

The key is a **restricted send-only key** (verified: `POST /emails` returns 422 for
a bad payload rather than 401, so authentication succeeds). It cannot read domains
or manage other keys, but it **can send email as your verified domain
`familyforge.app`** — a phishing vector against your own users.

### What was done

Commit `fb1d757` removed the key from all three files. The test scripts now read
`process.env.RESEND_API_KEY` and exit with a clear message if it is absent.

### What is still required

Removing the key from `HEAD` **does not un-expose it** — it remains readable in
git history at commit `3eb55d5`, and public repositories are continuously scraped.

1. Rotate the key at <https://resend.com/api-keys> (delete the old, create a new
   Sending-access key)
2. Store the replacement **only** in Supabase Edge Function secrets

### Secrets confirmed NOT leaked

Searched the entire git history:

- Supabase **service role key** — not present
- Supabase **database password** — not present

All four Edge Functions correctly read `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`
rather than embedding it.

### Note on key handling

`EXPO_PUBLIC_*` and `VITE_*` variables are compiled into the client bundle and are
readable by anyone who downloads the app. Only the Supabase **anon** key belongs
there — it is designed for public exposure and protected by Row Level Security.
The service role key bypasses RLS entirely and must never appear in the app.

---

## 3. Missing environment variables

### The problem

`eas env:list` returned **"No variables found for this environment"**. Builds were
shipping with no Supabase credentials at all.

`src/lib/api/supabase.ts:10-11` reads the credentials and falls back when absent:

```ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
// ...falls back to 'http://localhost' and 'public-anon-key'
```

**Confirmed by inspecting the compiled bundle:** build 7's Hermes bytecode
contained the literal strings `localhost` and `public-anon-key`, and did not
contain `supabase.co`. Every login and data call in build 7 was pointed at the
phone itself.

### Fix

Set on EAS for `production`, `preview` and `development`:

- `EXPO_PUBLIC_SUPABASE_URL` = `https://xyntgrgbacvnrdggtpkl.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = (anon key, `role: anon`, valid to 2036)

A gitignored local `.env` was created for development.

**Verified:** the rebuilt bundle contains the real project URL, and the
`public-anon-key` fallback string is gone.

### Related gotcha

The first rebuild produced a byte-identical bundle because **Metro's transform
cache** did not invalidate on the new `.env`. `expo export --clear` was required.
EAS builds are unaffected — the production profile already sets
`"cache": { "disabled": true }`.

---

## 4. The startup crash

### Evidence

Crash log from **build 8** on iPhone 18,2 / iOS 26.5.2:

```
Exception Type:  EXC_BAD_ACCESS (SIGSEGV)
Termination:     KERN_INVALID_ADDRESS at 0x6365446465747282
Triggered thread: com.facebook.react.runtime.JavaScript
```

The app launched at `16:57:21.228` and died at `16:57:21.341` — **113 milliseconds**,
before rendering anything.

**Faulting thread (JS):**

```
hermes::vm::Callable::defineLazyProperties
hermes::vm::JSObject::getComputedPrimitiveDescriptor
hermes::vm::JSObject::getComputedWithReceiver_RJS
hermes::vm::getMethod
hermes::vm::stringPrototypeReplace      ← String.prototype.replace
```

**Simultaneously, on `com.meta.react.turbomodulemanager.queue`:**

```
ObjCTurboModule::performVoidMethodInvocation
TurboModuleConvertUtils::convertNSExceptionToJSError
backtrace_symbols
```

### Interpretation

The faulting address `0x6365446465747282` decodes to ASCII bytes, not a valid
pointer — a **string was dereferenced as an object pointer**. That is memory
corruption, not an ordinary JavaScript error.

The TurboModule thread shows a **native iOS module threw an ObjC exception during
startup**, and React Native crashed *inside its own error reporter* while
converting that exception into a readable JS error. The original error message was
destroyed by the secondary crash, which is why no useful error was ever surfaced.

### Root cause (probable)

`expo-doctor` found **15 packages on versions Expo SDK 54 was never built against**,
including three native modules that load during startup — matching the 113 ms timing.

### Status

Fix shipped in build 9. **Not yet confirmed on a device.** If build 9 still
crashes, the next step is elimination: `KeyboardProvider`
(`src/app/_layout.tsx:236`) is the prime suspect, and temporarily removing it
would confirm or clear it in a single build.

---

## 5. Dependency misalignment

`expo-doctor` initially reported **2 checks failed, 15 packages out of date**.

### Major

| Package | Installed | SDK 54 expects |
|---|---|---|
| `@expo/vector-icons` | 14.1.0 **and** 15.0.3 (duplicated) | `^15.0.3` |

### Minor — including three native modules loaded at startup

| Package | Installed | SDK 54 expects |
|---|---|---|
| `react` | 19.2.4 | **19.1.0** |
| `react-dom` | 19.2.4 | **19.1.0** |
| `react-native-keyboard-controller` | 1.20.7 | **1.18.5** |
| `react-native-maps` | 1.27.1 | **1.20.1** |
| `@react-native-async-storage/async-storage` | 2.1.2 | **2.2.0** |
| `@react-native-community/datetimepicker` | 8.6.0 | 8.4.4 |
| `@types/react` | 19.2.13 | `~19.1.10` |
| `typescript` | 5.8.3 | `~5.9.2` |

### Patch

`expo` (54.0.33 → 54.0.36), `expo-font`, `expo-image-picker`, `expo-linking`,
`expo-notifications`, `expo-router`.

### Why this matters

React Native compiles its renderer against a specific React version, and native
modules against specific RN headers. Mismatches produce exactly the crash
signature observed — a native module throwing at startup with memory corruption
on the JS thread.

### Fix

`npx expo install --fix` aligned all 15. **`expo-doctor` now passes 18/18.**
The command also added the `@react-native-community/datetimepicker` config plugin
to `app.json`. Committed as `d00b499`.

---

## 6. Local environment corruption

The local `node_modules` was found to be **broadly corrupted** — the signature of
an interrupted install or antivirus interference with npm extraction on Windows:

| Package | Damage |
|---|---|
| `@babel/highlight` | Empty directory, no `package.json` |
| `react-native-reanimated` | `src/component/` had 2 of 8 files |
| `@supabase/supabase-js` | `dist/` missing the entire ESM build |

This blocked every `expo` and `eas` command with a **silent** exit code 1 — no
error output at all until `EXPO_DEBUG=1` revealed `Cannot find module
'@babel/highlight'`.

Resolved with a clean reinstall. This was local-only; EAS installs fresh on its
own servers, which is why builds succeeded while local commands failed.

### Lockfile was stale

`npm ci` refused to run — `package-lock.json` was out of sync with
`package.json` (missing `fsevents` and all `@esbuild/*` platform packages). This
forced EAS onto `npm install` rather than a reproducible `npm ci`. Regenerated
and committed in `f446694`.

---

## 7. Build & TestFlight pipeline

### `eas.json` had no submit profile

`eas build --auto-submit` failed *after* the build completed with
`Missing submit profile in eas.json: production`. Added:

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "6758824419",
      "appleTeamId": "VF3542MNWH"
    }
  }
}
```

### App Store Connect key was not linked

An API key existed on the account (`23PMY4A52T`, team `VF3542MNWH`) but was not
attached to this project, and the CLI refuses to attach one non-interactively.
Linked via the Expo API, so `--auto-submit` now works end to end.

### Build history

| Build | ID | Outcome |
|---|---|---|
| 7 | `9eef5be6` | Submitted to TestFlight. Crashed — no Supabase credentials |
| 8 | `7df0e8de` | Credentials fixed. Still crashed (log in §4) |
| 9 | `7afb1e49` | 15 dependencies aligned. Awaiting device verification |

---

## 8. Onboarding PIN entry bug

**Symptom:** on the combined email + PIN screen (step 19 of onboarding), the
6-digit PIN field could not be focused or typed into.

Two compounding defects:

### a) The hidden input was positioned wrong

`src/app/onboarding.tsx` — the transparent `TextInput` used:

```jsx
style={{ position: "absolute", opacity: 0, width: "100%", height: "100%" }}
```

With `position: absolute` and **no inset coordinates**, React Native lays the
element out at its *static* position — which, as the second child in a column, is
*below* the digit boxes rather than over them. Combined with `opacity: 0`, which
iOS treats inconsistently for hit-testing, focus depended entirely on the wrapping
`Pressable` firing.

Replaced with an overlay that explicitly covers the boxes
(`top/left/right/bottom: 0`, `opacity: 0.01`, `color: "transparent"`,
`caretHidden`), with `pointerEvents="none"` on the visual layer so taps reach the
input directly.

### b) The first tap was eaten by keyboard dismissal

Both scroll containers used `keyboardShouldPersistTaps="handled"`. With
`"handled"`, moving from the **already-focused email field** to the PIN field
spends the first tap dismissing the keyboard rather than focusing the next input —
producing exactly "I can't enter the PIN at the email stage".

Changed to `keyboardShouldPersistTaps="always"` on both the main `ScrollView`
and the `KeyboardAwareScrollView` used by the children-entry step.

### Related dead code

`confirmPinInputRef` (`onboarding.tsx:362`) is declared but never used —
harmless, but a leftover from an earlier confirm-PIN flow.

### Resolution: shared `PinInput` component

Both screens had separate, separately-broken PIN implementations. Replaced with
one component, `src/components/PinInput.tsx`, used by login and onboarding.

It renders a **single** real `TextInput` stretched invisibly across the display
boxes, rather than one input per box. With one input per box you must juggle
focus refs manually, and iOS fights you — `secureTextEntry` + `maxLength={1}`
clears fields on refocus, and auto-advance stalls when a box already holds a
digit (the login screen's bug). With a single input the value is just a string,
so digits fill left to right on their own, backspace works, and the "cursor" is
simply the box at `index === value.length`.

---

## 8b. No authentication guard on protected routes — **critical**

**Symptom reported:** entering incorrect login details still granted access.

### Root cause

The backend was never at fault. Tested directly against Supabase:

| Attempt | Result |
|---|---|
| Wrong password | `HTTP 400` |
| Correct password | `HTTP 200` |
| Non-existent user | `HTTP 400` |

`signIn` in `src/lib/api/auth.ts:155` and the `AuthContext` wrapper
(`auth-context.tsx:128`) both handle results correctly.

**The actual defect: the app had no auth guard at all.**

`src/app/index.tsx` routed on `onboardingComplete && avatarSetupComplete` — two
**local Zustand flags persisted in AsyncStorage**. Authentication was never
consulted. `src/app/(tabs)/_layout.tsx` contained no check either.

So once onboarding had been completed on a device, those flags stayed `true`
permanently — surviving sign-out and persisting across sessions. Anyone opening
the app on that device was routed straight to `/(tabs)/home` and into real family
data, with or without a valid session. A failed login did not need to "succeed";
the tabs were simply never protected.

### Fix

- `(tabs)/_layout.tsx` now calls `useAuth()`, waits for `isLoading` to settle so
  a restored session is not mistaken for absence, and returns
  `<Redirect href="/login" />` when there is no user.
- `index.tsx` performs the same check before routing into the tabs, so the
  redirect is decided once rather than flashing through the tab layout.

Child mode is unaffected: it is a local flag (`isChildMode`) entered from within
the authenticated parent session, and `child-dashboard` lives outside `(tabs)`.

### Worth reviewing

Other routes outside `(tabs)` — `family-calendar`, `deadlines`, `settings-full`,
`give-access` and similar — are still individually unguarded. They are only
reachable by navigation from a guarded screen today, but a deep link would
bypass that.

---

## 8c. Email verification screen hung forever

**Symptom reported:** the emailed code arrived and was entered correctly, but the
verification screen span indefinitely and never advanced.

### Root cause

A self-cancelling `useEffect` in `src/app/onboarding.tsx` (auto-verify at step 20).

`isVerifying` was both **set inside the effect** and **listed in its own
dependency array**, while the cleanup cleared the pending timer:

```ts
if (isVerifying) return;          // guard
setIsVerifying(true);             // ...which this immediately invalidates
const timer = setTimeout(() => { ...; nextStep(); }, 400);
return () => clearTimeout(timer); // cleanup kills the timer on re-run
}, [..., isVerifying, ...]);      // <-- re-runs when isVerifying flips
```

Sequence:

1. Correct code entered → effect runs → `setIsVerifying(true)`, timer scheduled
2. `isVerifying` flips → effect re-runs (it is a dependency)
3. React runs the **previous cleanup first** → `clearTimeout` kills the timer
4. The re-run bails at `if (isVerifying) return` and schedules nothing

The timer never fired, so `nextStep()` was never called and `isVerifying` stayed
`true` permanently.

### Fix

Removed `isVerifying` from the dependency array and from the effect body. The
remaining dependencies (`step`, `verificationInput`, `emailVerificationCode`,
`nextStep`, `setEmailVerified`) are stable during the 400 ms window — the latter
two are plain Zustand actions defined once in the store creator — so the timer
now survives to completion.

The manual verify path in `handleContinue` (step 20) was already correct; it
clears `isVerifying` on every branch.

Audited the rest of the file for the same pattern: the only other timer-based
effect (step 17 loading screen) is safe — it uses a functional state updater and
does not list the state it sets.

---

## 8d. Database was world-readable and world-writable — **critical, fixed**

Found while checking whether Row Level Security would block the new streak
writes. It did not — because there was none.

### What was wrong

**17 of 42 public tables had RLS disabled**, and role `anon` held
`SELECT, INSERT, UPDATE, DELETE, TRUNCATE` on them.

The anon key is compiled into **both** app binaries and is extractable from any
TestFlight or App Store install. So anyone who downloaded FamilyForge could:

- Read `admin_users` — including every admin's email and `password_hash`
  (confirmed live: 1 row returned to a plain anon request)
- **`INSERT` themselves a row with `role = 'superadmin'`** — full privilege
  escalation into the admin dashboard
- `DELETE` or `TRUNCATE` the admin table entirely
- Read and write `parent_profiles`, `user_sessions`, `user_support_notes`,
  `revenue_snapshots`, `subscription_events` and the rest as they filled

This was not merely a data leak. It was unauthenticated privilege escalation.

The escalation path was proven from the grant listing rather than by writing to
the production table.

### Fix — migrations 012 and 013

Three access models, chosen per table by who actually reads it:

| Model | Tables | Rule |
|---|---|---|
| Public read | `app_settings` | Subscription pricing is shown before sign-in, so `anon` keeps SELECT; writes are admin-only |
| Parent-owned | `parent_goals`, `parent_profiles`, `parent_routines`, `user_streaks` | `parent_id = auth.uid()`; admins may read all |
| Admin-only | the other 11 | Referenced by no client code and all empty, so deny-by-default costs nothing |

`admin_users` keeps a deliberate exception: an authenticated user may read
**their own** row, because that is exactly how the dashboard answers "am I an
admin?" (`admin/src/App.tsx` queries it with the user's own access token, not the
anon key). Admins may read and write every row, which the dashboard's list,
upsert and delete paths need.

`public.is_admin_user()` is `SECURITY DEFINER` with a pinned `search_path` — a
policy on `admin_users` cannot query `admin_users` without recursing, and the
pinned path stops the function being hijacked through a caller-controlled schema.

### Verified

Access was tested by simulating exactly what PostgREST does — switching to the
`anon` / `authenticated` role and setting `request.jwt.claims` — and then
confirmed again through the live REST API:

| Check | Result |
|---|---|
| `anon` on all 16 previously-open tables | **401 permission denied** |
| `anon` INSERT superadmin into `admin_users` | **denied** |
| `app_settings` (pricing) still public | **200, 1 row** |
| Parent reading another parent's rows | **0 rows — isolated** |
| Parent writing as another parent | **denied by policy** |
| Parent writing their own streak | works (streak feature intact) |
| Admin dashboard login + admin management | both work |
| **Tables still without RLS** | **0** (was 17) |

### Bootstrapping caveat

Because writes to `admin_users` require an existing admin, the table must never
be emptied — there would be no way to insert the first admin back through the
API. Recovery would need the service role key or the SQL editor.

---

## 9. Product audit: impact & retention

Findings below are grounded in the codebase, not general advice.

### 9.1 The notification system never fires — highest impact

`requestNotificationPermissions()` exists at
`src/lib/utils/notifications.ts:118` and **has zero callers anywhere in `src/`**.

Without permission, iOS rejects every `scheduleNotificationAsync` call — and
`scheduleNotificationWithKey` swallows the failure silently:

```ts
try {
  const id = await Notifications.scheduleNotificationAsync({ content, trigger });
} catch {
  return null;   // every failure disappears here
}
```

`scheduleAllNotifications` runs on every launch (`src/app/_layout.tsx:55`) and
schedules task reminders, routine reminders, deadline alerts, overdue alerts and
daily motivation. **None are ever delivered.**

For a family habit app, notifications *are* the retention mechanism. This is a
fully built re-engagement engine that is switched off.

**Fix:** call `requestNotificationPermissions()` after onboarding completes, with
context ("Want reminders when tasks are due?") rather than at cold start. iOS
permits the prompt **once** — after that the user must be sent to Settings, so
timing matters.

### 9.2 Streaks are built but not connected

Infrastructure that already exists:

- `user_streaks` table with `streak_type` for `daily_login`, `task_completion`,
  `learning`, `routine` — `supabase/migrations/009_analytics_and_tracking.sql:187`
- `current_streak` / `streak` columns —
  `supabase/migrations/003_add_profile_and_routines.sql`
- `notifyStreakMilestone()` with 🔥/⭐/✨ tiers — `src/lib/api/notifications.ts:301`

**None of it is wired up.** `notifyStreakMilestone` has zero callers, and the app
never reads or writes `user_streaks` — the only reference anywhere is
`current_streak` for goals (`src/lib/api/profile.ts:94`).

Streaks are the most reliably proven retention mechanic in consumer habit apps.
The schema cost is already paid.

### 9.3 Email is captured at step 19 of 24

Onboarding spans **steps 0–23** across 2,330 lines. Account creation happens at
**step 19** (`onboarding.tsx:500-518`).

Users answer 19 screens of emotionally heavy questions — parenting fears, guilt
reflection, worries about their child — before there is any way to contact them.
Anyone who drops at step 12 is unreachable.

An abandoned-onboarding email system **already exists**
(`supabase/functions/process-abandoned-emails`) and cannot function, because
abandoners have no email on file.

**Highest-leverage change available:** move email capture to roughly step 3-5.
Everything after becomes recoverable, and the existing abandoned-email function
starts working with no new code.

Separately, 24 steps is long. Worth separating questions that change app
behaviour from those that build emotional investment, and moving the latter
post-signup.

### 9.4 Six tabs dilute the daily loop

`home`, `children`, `tasks`, `rewards`, `progress`, `profile`.

Convention is 3-5. `rewards` and `progress` are both "look at outcomes";
`children` overlaps `home`. Suggested consolidation: **Today**, **Family**,
**Rewards**, **Profile** — so there is one obvious answer to "why open this app
right now?"

### 9.5 The paywall was only reachable from Profile — **fixed**

`/upgrade` is a 997-line screen that was linked from exactly one place: a menu row
in `src/app/(tabs)/profile.tsx:38-42`. Users only reached it by hunting for it.

Worse, `give-access.tsx` had **no plan gating at all**, despite `WARNINGS.md`
stating that partner/guardian sharing is Forge-only. Any tier could invite family
members, so the feature was neither enforced nor sold.

**Fix.** New `src/lib/plans.ts` holds plan capabilities in one place, and
`src/components/UpgradePrompt.tsx` renders a contextual upsell that carries a
`source` parameter through to the upgrade screen.

Wired into `give-access.tsx`:

- Non-Forge users see the upsell in place of the invite flow
- The gate sits inside `openInviteModal` itself, so it covers every entry point
  (header button, empty state) and cannot be bypassed by adding another caller
- The capability check is a Zustand selector returning a primitive, so it only
  re-renders when the answer actually changes

**One product decision left open.** Pro (4 children) and Forge (unlimited) come
from the upgrade screen's own copy, but the **free tier's child limit is not
stated anywhere in the codebase**. Rather than invent a number, `maxChildren` for
free is left unlimited and flagged in `plans.ts`. Set it before relying on the
child-count gate.

### 9.6 Children had no agency — **fixed**

Per `WARNINGS.md`, child accounts were **strictly view-only**. The parent
performed every action: creating tasks, marking them complete, awarding points,
managing rewards. The child received a scoreboard.

That concentrated all effort on the person most likely to churn, and gave the
person the app is *about* nothing to do.

**Fix — "I did it → parent approves".** A new `pending_approval` task status sits
between pending and completed:

| Action | Who | Effect |
|---|---|---|
| `submitTaskForApproval` | Child | Marks the task claimed. **Awards no points.** |
| `approveTask` | Parent | Completes the task and awards the points |
| `rejectTask` | Parent | Returns it to pending so the child can redo it |

Points are awarded only on approval — `approveTask` delegates to `completeTask`
so there is one award path, and a child cannot award themselves anything.

Changes:

- `src/lib/types.ts` — new status plus `submittedAt`
- `src/lib/state/app-store.ts` — the three actions above
- `src/app/(tabs)/tasks.tsx` — children see "I did it! 🎉" then "Waiting for
  approval ⏳"; parents see "Approve" / "Not yet" with the points at stake named
- `supabase/migrations/011_add_pending_approval_status.sql` — enum value,
  `submitted_at` column, partial index. **Applied to the live database**
  (`task_status` now reads `pending, completed, skipped, pending_approval`)

Two traps handled: the `pending` filter now includes `pending_approval`, or a
claimed task would have vanished from every view while it waited; and
`shouldAutoMiss` already guards on `status !== 'pending'`, so a submitted task
cannot be auto-missed out from under the child.

### 9.7 Ranked by impact per unit of effort

| # | Change | Effort | Status |
|---|---|---|---|
| 1 | Fix notification permission timing | Very low | **Implemented** |
| 2 | Wire up streaks | Low | **Implemented** |
| 3 | Contextual paywall triggers | Low | **Implemented** |
| 4 | Child "mark done → approve" | High | **Implemented** |

Deliberately **not** being done, by product decision:

- Moving email capture earlier in onboarding (was §9.3)
- Consolidating 6 tabs down to 4 (was §9.4)

The highest-value remaining work is a completion of item 2: **display the streak
in the UI.** It is now recorded but shown nowhere, and a streak nobody can see
creates no loss aversion — which is the entire mechanism.

---

## 10. Outstanding actions

### Urgent

1. **Rotate the Resend API key** — <https://resend.com/api-keys>. Still public in
   git history at `3eb55d5`.
2. **Set `RESEND_API_KEY`** in Supabase Edge Function secrets. Until then all
   email is broken. Server-side only — no rebuild needed.

### Verification

3. Install **build 9** from TestFlight and confirm the crash is resolved. If not,
   capture a fresh crash log (Settings → Privacy & Security → Analytics &
   Improvements → Analytics Data → newest `FamilyForge` entry).
4. Test the **PIN field** on the email/PIN onboarding screen.

### Recommended

5. Rotate the Supabase service role key and database password as a precaution
   (neither leaked, but both were shared over chat).
6. Consider making the GitHub repository private.
7. Reconsider Supabase `autoconfirm: true` before launch — it currently allows
   registration with unverified email addresses.
8. Address the 54 pre-existing TypeScript errors, including
   `onboarding.tsx:672` (`avatar_url` missing from `ParentData`).

---

*Prepared 28 July 2026.*

// Which of the two apps is running.
//
// Set at build time by app.config.ts from the APP_VARIANT env var and carried
// into the binary via `extra.appVariant`. Read it through here rather than
// touching Constants directly, so the fallback and the type live in one place.

import Constants from 'expo-constants';

export type AppVariant = 'parent' | 'child';

/**
 * Defaults to 'parent'. That matters: if the value is ever missing or
 * malformed, falling back to the parent app is the safe direction — the child
 * app is the more restricted of the two, and a child build that silently
 * degraded into a full parent experience would hand a child the whole account.
 */
export const APP_VARIANT: AppVariant =
  (Constants.expoConfig?.extra as { appVariant?: string } | undefined)?.appVariant === 'child'
    ? 'child'
    : 'parent';

export const isChildApp = APP_VARIANT === 'child';
export const isParentApp = APP_VARIANT === 'parent';

import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Two apps, one codebase.
 *
 * FamilyForge ships as two App Store products — the parent app and a separate
 * child app — built from this single source tree. `app.json` holds everything
 * common; this file overlays whatever differs per variant.
 *
 * Two repos was the alternative and was rejected deliberately: the auth layer,
 * Supabase client, store, types and shared components would have to be
 * maintained twice, and they would drift.
 *
 *   Parent:  npx expo start                       (default)
 *   Child:   APP_VARIANT=child npx expo start
 *   Builds:  eas build --profile production        (parent)
 *            eas build --profile production-child  (child)
 *
 * The variant is surfaced to the running app through `extra.appVariant`; read it
 * via `src/lib/appVariant.ts` rather than reaching into Constants directly.
 */

export type AppVariant = 'parent' | 'child';

const VARIANT: AppVariant = process.env.APP_VARIANT === 'child' ? 'child' : 'parent';
const isChild = VARIANT === 'child';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isChild ? 'FamilyForge Kids' : 'FamilyForge: Rewards and Growth for Kids',
  // Slug stays constant: both variants belong to the same EAS project and differ
  // by bundle identifier. Changing it would orphan the existing build history.
  slug: 'familyforge',
  scheme: isChild ? 'familyforgekids' : 'familyforge',

  ios: {
    ...config.ios,
    bundleIdentifier: isChild ? 'com.familyforge.kids' : 'com.familyforge.app',
    supportsTablet: true,
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    ...config.android,
    package: isChild ? 'com.familyforge.kids' : 'com.familyforge.app',
  },

  extra: {
    ...config.extra,
    appVariant: VARIANT,
  },
});

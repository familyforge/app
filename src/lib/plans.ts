// Plan capabilities in one place.
//
// Until now the only route to the upgrade screen was a menu row in Profile
// (`src/app/(tabs)/profile.tsx`), so users reached it by deliberately hunting for
// it. Upsells convert far better at the moment someone actually wants the thing
// they cannot have, which needs a single shared answer to "can this plan do X?".

import type { PlanType } from './state/profile-store';

export interface PlanCapabilities {
  /** Partner / guardian access sharing. Forge-only per WARNINGS.md. */
  accessSharing: boolean;
  /** Cloud sync across devices. Forge-only per WARNINGS.md. */
  cloudSync: boolean;
  /**
   * Maximum children. Pro = 4 and Forge = unlimited come from the upgrade
   * screen's own copy (`src/app/upgrade.tsx`).
   *
   * NOTE: the FREE tier's child limit is not stated anywhere in this codebase or
   * in WARNINGS.md, so it is left unlimited rather than invented here. Set a real
   * number before relying on the child-count gate for free users.
   */
  maxChildren: number;
}

export const PLAN_CAPABILITIES: Record<PlanType, PlanCapabilities> = {
  free: { accessSharing: false, cloudSync: false, maxChildren: Infinity },
  pro: { accessSharing: false, cloudSync: false, maxChildren: 4 },
  forge: { accessSharing: true, cloudSync: true, maxChildren: Infinity },
};

export function capabilitiesFor(plan: PlanType | undefined): PlanCapabilities {
  return PLAN_CAPABILITIES[plan ?? 'free'] ?? PLAN_CAPABILITIES.free;
}

export function can(plan: PlanType | undefined, feature: 'accessSharing' | 'cloudSync'): boolean {
  return capabilitiesFor(plan)[feature];
}

/** True when adding one more child would exceed the plan's allowance. */
export function wouldExceedChildLimit(plan: PlanType | undefined, currentCount: number): boolean {
  return currentCount + 1 > capabilitiesFor(plan).maxChildren;
}

/** The lowest plan that unlocks a given feature — so prompts name the right tier. */
export function requiredPlanFor(feature: 'accessSharing' | 'cloudSync' | 'moreChildren'): PlanType {
  if (feature === 'moreChildren') return 'forge';
  return 'forge';
}

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
  forge: 'Forge',
};

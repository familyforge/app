// Re-engagement nudge built from what the parent told us during onboarding.
//
// Onboarding asks 24 screens of emotionally heavy questions — what they fear,
// what they want to change, what they'd fix if they could fix one thing. Until
// migration 019 those answers were written to a column that did not exist, so
// PostgREST rejected the whole write and every answer was discarded.
//
// Now they are stored, the most valuable one — the six-month hope — is worth
// giving back. A generic "come back!" push is noise; their own words are not.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { requestNotificationPermissions } from './notifications';

/** Quiet for this long before the nudge fires. */
export const INACTIVITY_HOURS = 5;

const REMINDER_KEY = 'goal-reminder';

interface OnboardingAnswers {
  hopeChange?: string;
  fixOneThing?: string;
  commitment?: string;
  parentStrength?: string;
}

/** The parent's own words, preferred in order of how specific they are. */
export function pickGoal(answers: OnboardingAnswers | null, explicit?: string | null): string | null {
  const candidate =
    explicit?.trim() ||
    answers?.hopeChange?.trim() ||
    answers?.fixOneThing?.trim() ||
    answers?.commitment?.trim();
  if (!candidate) return null;
  // Keep it short enough to survive a notification banner without truncation.
  return candidate.length > 90 ? `${candidate.slice(0, 87).trimEnd()}…` : candidate;
}

function buildBody(goal: string | null): string {
  if (!goal) {
    return 'A couple of minutes today keeps things moving. Your family is waiting.';
  }
  // Quoting them back is the entire point — this is why it is worth sending.
  return `You said you wanted: "${goal}". A few minutes today gets you closer.`;
}

/**
 * Schedule the nudge for INACTIVITY_HOURS from now, replacing any pending one.
 *
 * Call on every app open. Each call pushes the reminder further out, so it only
 * ever fires after a genuine gap rather than on a timer the parent cannot reset.
 */
export async function scheduleGoalReminder(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  // Check only — never prompt here. This runs on app open, and the one-shot iOS
  // dialog belongs at the end of onboarding, not at a random launch.
  const allowed = await requestNotificationPermissions({ promptIfNeeded: false });
  if (!allowed) return false;

  try {
    // Cancel the previous one first: two overlapping reminders would both fire.
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === REMINDER_KEY)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    let goal: string | null = null;

    if (isSupabaseConfigured()) {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user?.id) {
        const { data } = await (supabase as unknown as {
          from: (t: string) => {
            select: (c: string) => {
              eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> };
            };
          };
        })
          .from('parents')
          .select('onboarding_data,six_month_goal')
          .eq('id', auth.user.id)
          .maybeSingle();

        const row = data as { onboarding_data?: OnboardingAnswers; six_month_goal?: string } | null;
        goal = pickGoal(row?.onboarding_data ?? null, row?.six_month_goal);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Remember why you started',
        body: buildBody(goal),
        data: { kind: REMINDER_KEY },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: INACTIVITY_HOURS * 60 * 60,
        repeats: false,
      },
    });

    return true;
  } catch (err) {
    console.warn('[goalReminder] could not schedule:', err);
    return false;
  }
}

/** Drop any pending nudge — used on sign-out. */
export async function cancelGoalReminder(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === REMINDER_KEY)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    /* best effort */
  }
}

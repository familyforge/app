// Registering this device for push.
//
// `parents.push_token` and `children.push_token` have existed since the first
// migration and were read by src/lib/api/notifications.ts — but nothing ever
// wrote them, so every lookup found null and no push was ever addressable.
//
// NOTE: remote push does not work in Expo Go from SDK 53 onward. This is a
// no-op there and only takes effect in a real build.

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { requestNotificationPermissions } from './notifications';

let lastRegistered: string | null = null;

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId;
}

/**
 * Fetch this device's Expo push token and store it against the signed-in user.
 *
 * `who` decides which table the token lands in: a parent's own row, or the
 * child's row in the Kids app.
 *
 * Never prompts. Permission is asked for at the end of onboarding; if the user
 * declined, this quietly does nothing rather than nagging on every launch.
 */
export async function registerPushToken(who: 'parent' | 'child'): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!isSupabaseConfigured()) return null;

  try {
    const allowed = await requestNotificationPermissions({ promptIfNeeded: false });
    if (!allowed) return null;

    const id = projectId();
    if (!id) {
      console.warn('[push] no EAS projectId; cannot mint a push token');
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    if (!token) return null;

    // Tokens are stable per install, so skip the write when nothing changed.
    if (token === lastRegistered) return token;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return null;

    const db = supabase as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => {
          eq: (k: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };

    // In the Kids app the session belongs to the child, so the token is stored
    // against children.auth_user_id rather than a parent row.
    const { error } =
      who === 'child'
        ? await db.from('children').update({ push_token: token }).eq('auth_user_id', userId)
        : await db.from('parents').update({ push_token: token }).eq('id', userId);

    if (error) {
      console.warn('[push] could not store token:', error.message);
      return null;
    }

    lastRegistered = token;
    return token;
  } catch (err) {
    console.warn('[push] registration failed:', err);
    return null;
  }
}

export type PushEvent = 'task_claimed' | 'task_approved';

/**
 * Ask the backend to push someone.
 *
 * Delivery runs in an Edge Function because addressing the OTHER party means
 * reading a token the caller has no right to see — a child must not be able to
 * read their parent's push token, or anyone else's.
 */
export async function sendPushForTask(event: PushEvent, taskId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase.functions.invoke('notify-push', {
      body: { event, taskId },
    });
    if (error) {
      console.warn('[push] send failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[push] send failed:', err);
    return false;
  }
}

// One affirmation a day, drawn from what this parent actually told us.
//
// Delivery has three cases, and the third is the one that is usually missed:
//
//   1. App open at 07:00        -> in-app modal
//   2. App closed at 07:00      -> local notification
//   3. Notification ignored     -> the SAME message is shown as a modal the next
//                                  time the app opens, so a parent who was busy
//                                  at 7am still receives it rather than losing it
//
// The message is chosen once per day and persisted, so cases 2 and 3 deliver
// identical text — a parent must never get one thing in the banner and a
// different thing on screen.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { AFFIRMATIONS, type AffirmationField } from '../content/affirmations';
import { requestNotificationPermissions } from './notifications';

const STORAGE_KEY = 'daily-affirmation';
const NOTIFICATION_KIND = 'daily-affirmation';

/** Local hour the message is delivered. */
export const DELIVERY_HOUR = 7;

export interface DailyAffirmation {
  /** YYYY-MM-DD this was chosen for. */
  date: string;
  message: string;
  /** Which answer produced it, for debugging and future analytics. */
  source: string;
  /** True once the parent has actually seen it on screen. */
  seen: boolean;
}

/** Local date key — the parent's own day, not UTC. */
function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Answers = Partial<Record<AffirmationField, string | string[] | null>>;

/**
 * Every message this parent is eligible for, based on the options they chose.
 *
 * Multi-select fields contribute one pool per selected option, so a parent who
 * picked three pain points has three times the variety.
 */
function eligible(answers: Answers): Array<{ message: string; source: string }> {
  const pool: Array<{ message: string; source: string }> = [];

  for (const [field, table] of Object.entries(AFFIRMATIONS) as Array<
    [AffirmationField, Record<string, string[]>]
  >) {
    const answer = answers[field];
    if (!answer) continue;
    const chosen = Array.isArray(answer) ? answer : [answer];
    for (const option of chosen) {
      const variants = table[option];
      if (!variants) continue;
      for (const message of variants) {
        pool.push({ message, source: `${field}.${option}` });
      }
    }
  }

  return pool;
}

/** Replace the placeholder with the parent's first name, or drop it gracefully. */
function personalise(message: string, name?: string | null): string {
  const first = (name ?? '').trim().split(/\s+/)[0];
  if (!first) {
    // Without a name the sentence must still read naturally: "{name}, you..." →
    // "You...", rather than leaving a dangling comma.
    return message
      .replace(/^\{name\},\s*/, (m) => '')
      .replace(/\{name\},?\s*/g, '')
      .replace(/^([a-z])/, (c) => c.toUpperCase());
  }
  return message.replace(/\{name\}/g, first);
}

async function readStored(): Promise<DailyAffirmation | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DailyAffirmation) : null;
  } catch {
    return null;
  }
}

async function write(value: DailyAffirmation): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* best effort */
  }
}

/** Load the parent's onboarding answers and name. */
async function loadAnswers(): Promise<{ answers: Answers; name: string | null }> {
  if (!isSupabaseConfigured()) return { answers: {}, name: null };
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return { answers: {}, name: null };

    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> };
        };
      };
    })
      .from('parents')
      .select('name,onboarding_data')
      .eq('id', auth.user.id)
      .maybeSingle();

    const row = data as { name?: string; onboarding_data?: Answers } | null;
    return { answers: row?.onboarding_data ?? {}, name: row?.name ?? null };
  } catch {
    return { answers: {}, name: null };
  }
}

/**
 * Choose today's message, if one has not already been chosen.
 *
 * Stable for the whole day: calling this repeatedly returns the same message, so
 * the notification and the in-app modal can never disagree.
 */
export async function ensureTodaysAffirmation(): Promise<DailyAffirmation | null> {
  const stored = await readStored();
  if (stored && stored.date === todayKey()) return stored;

  const { answers, name } = await loadAnswers();
  const pool = eligible(answers);
  // A parent who skipped every choice question has nothing to draw from, and a
  // generic platitude would be worse than silence.
  if (pool.length === 0) return null;

  // Avoid immediately repeating yesterday's line where there is any choice.
  const candidates =
    pool.length > 1 && stored ? pool.filter((p) => personalise(p.message, name) !== stored.message) : pool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];

  const chosen: DailyAffirmation = {
    date: todayKey(),
    message: personalise(pick.message, name),
    source: pick.source,
    seen: false,
  };
  await write(chosen);
  return chosen;
}

/** Today's message if it has not yet been shown on screen. */
export async function pendingAffirmation(): Promise<DailyAffirmation | null> {
  const stored = await readStored();
  if (!stored || stored.date !== todayKey() || stored.seen) return null;
  return stored;
}

export async function markAffirmationSeen(): Promise<void> {
  const stored = await readStored();
  if (stored) await write({ ...stored, seen: true });
}

/**
 * Schedule the 07:00 delivery.
 *
 * Uses a DAILY trigger so it survives the app being closed for days. The body is
 * today's chosen message; it is refreshed on each app open so the banner keeps
 * pace with the stored pick.
 */
export async function scheduleDailyAffirmation(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  // Check only — the one-shot iOS prompt belongs at the end of onboarding.
  const allowed = await requestNotificationPermissions({ promptIfNeeded: false });
  if (!allowed) return false;

  const affirmation = await ensureTodaysAffirmation();
  if (!affirmation) return false;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === NOTIFICATION_KIND)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A moment for you',
        body: affirmation.message,
        data: { kind: NOTIFICATION_KIND, date: affirmation.date },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: DELIVERY_HOUR,
        minute: 0,
      },
    });

    return true;
  } catch (err) {
    console.warn('[affirmation] could not schedule:', err);
    return false;
  }
}

export async function cancelDailyAffirmation(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === NOTIFICATION_KIND)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    /* best effort */
  }
}

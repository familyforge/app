// Streak tracking.
//
// The `user_streaks` table (migration 009) and `notifyStreakMilestone` have
// existed since the start but nothing ever wrote to them, so no streak was ever
// counted. This module is the missing link.
//
// Every helper here is failure-tolerant on purpose: a streak is a nice-to-have
// on top of the real action (completing a task, opening the app). If the network
// is down or the user is offline, the underlying action must still succeed, so
// nothing in here ever throws.

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { notifyStreakMilestone } from './notifications';

// `user_streaks` is missing from the generated Database types — database.types.ts
// predates migration 009, which created the table. Rather than weaken the typed
// client everywhere (or hand-edit a 1,394-line UTF-16 generated file), this one
// untyped view is scoped to this module. Regenerating the types with
// `supabase gen types typescript` would let this be removed.
const db = supabase as unknown as SupabaseClient;

export type StreakType = 'daily_login' | 'task_completion' | 'learning' | 'routine';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  /** True when this call moved the streak on to a new day. */
  advanced: boolean;
  /** Set to the milestone number when this call landed exactly on one. */
  milestoneReached: number | null;
}

/** Mirrors the milestones `notifyStreakMilestone` will actually notify on. */
const MILESTONES = [7, 14, 21, 30, 50, 100, 365];

const HUMAN_LABEL: Record<StreakType, string> = {
  daily_login: 'daily check-ins',
  task_completion: 'tasks',
  learning: 'learning',
  routine: 'routines',
};

/** Local (not UTC) YYYY-MM-DD — a streak should follow the user's own day. */
function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Record activity for today and advance the streak.
 *
 * Calling this more than once on the same day is a no-op beyond the first, so
 * callers can fire it freely without tracking whether it already ran.
 */
export async function recordStreakActivity(
  streakType: StreakType,
  options: { childName?: string } = {}
): Promise<StreakResult | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const parentId = auth?.user?.id;
    if (!parentId) return null;

    const now = new Date();
    const today = dateKey(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = dateKey(yesterdayDate);

    const { data: existing } = await db
      .from('user_streaks')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('parent_id', parentId)
      .eq('streak_type', streakType)
      .maybeSingle();

    const row = existing as {
      current_streak: number | null;
      longest_streak: number | null;
      last_activity_date: string | null;
    } | null;

    // Already counted today — report the standing streak without touching it.
    if (row?.last_activity_date === today) {
      return {
        currentStreak: row.current_streak ?? 0,
        longestStreak: row.longest_streak ?? 0,
        advanced: false,
        milestoneReached: null,
      };
    }

    // Consecutive day continues the run; any longer gap starts a fresh one.
    const currentStreak = row?.last_activity_date === yesterday ? (row.current_streak ?? 0) + 1 : 1;
    const longestStreak = Math.max(currentStreak, row?.longest_streak ?? 0);

    const { error } = await db.from('user_streaks').upsert(
      {
        parent_id: parentId,
        streak_type: streakType,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: now.toISOString(),
      },
      { onConflict: 'parent_id,streak_type' }
    );

    if (error) {
      console.warn('[streaks] could not save streak:', error.message);
      return null;
    }

    const milestoneReached = MILESTONES.includes(currentStreak) ? currentStreak : null;

    if (milestoneReached) {
      // Best-effort: a failed notification must not undo a recorded streak.
      try {
        await notifyStreakMilestone(
          parentId,
          options.childName ?? 'Your family',
          milestoneReached,
          HUMAN_LABEL[streakType]
        );
      } catch (err) {
        console.warn('[streaks] milestone notification failed:', err);
      }
    }

    return { currentStreak, longestStreak, advanced: true, milestoneReached };
  } catch (err) {
    console.warn('[streaks] recordStreakActivity failed:', err);
    return null;
  }
}

/** Read a streak without recording activity — for display. */
export async function getStreak(streakType: StreakType): Promise<StreakResult | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const parentId = auth?.user?.id;
    if (!parentId) return null;

    const { data } = await db
      .from('user_streaks')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('parent_id', parentId)
      .eq('streak_type', streakType)
      .maybeSingle();

    const row = data as {
      current_streak: number | null;
      longest_streak: number | null;
      last_activity_date: string | null;
    } | null;
    if (!row) return null;

    // A streak whose last activity is older than yesterday has already lapsed;
    // report 0 rather than a stale number the user has actually lost.
    const now = new Date();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const isLive =
      row.last_activity_date === dateKey(now) || row.last_activity_date === dateKey(yesterdayDate);

    return {
      currentStreak: isLive ? row.current_streak ?? 0 : 0,
      longestStreak: row.longest_streak ?? 0,
      advanced: false,
      milestoneReached: null,
    };
  } catch {
    return null;
  }
}

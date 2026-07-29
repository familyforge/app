// Loads the signed-in child's own data.
//
// The app is otherwise local-first: a parent's children and tasks live in the
// Zustand store on the parent's device. A child signing in on their own device
// has an empty store, so the child app has to pull its data down. RLS
// (migration 014) already restricts every query here to the one child, so no
// filtering by id is needed — the database returns only what they may see.

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

// learning_progress postdates the generated database types.
const db = supabase as unknown as SupabaseClient;
import type { Child, Task, TaskCategory, TaskStatus } from '../types';

interface ChildRow {
  id: string;
  name: string;
  age: number | null;
  points: number | null;
  avatar: string | null;
  picture: string | null;
  class: string | null;
  caregiver_label: string | null;
  visual_theme: string | null;
  reduce_motion: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TaskRow {
  id: string;
  child_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  points: number | null;
  status: string | null;
  due_date: string | null;
  created_at: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  assigned_by_label: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface ChildSession {
  child: Child;
  tasks: Task[];
  /** Visual preferences the parent set for this child. */
  visualTheme: 'vivid' | 'calm';
  reduceMotion: boolean;
}

const asStatus = (s: string | null): TaskStatus =>
  s === 'completed' || s === 'skipped' || s === 'pending_approval' ? s : 'pending';

/**
 * Fetch the signed-in child's record and tasks.
 * Returns null when there is no session, or the account is not a child.
 */
export async function loadChildSession(): Promise<ChildSession | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return null;

    // RLS limits this to the row whose auth_user_id matches the caller.
    const { data: childRows, error: childErr } = await supabase
      .from('children')
      .select('id,name,age,points,avatar,picture,class,caregiver_label,visual_theme,reduce_motion,created_at,updated_at')
      .limit(1);

    if (childErr) {
      console.warn('[childSession] child lookup failed:', childErr.message);
      return null;
    }

    const row = (childRows as unknown as ChildRow[] | null)?.[0];
    // A parent signing into the child app has no children row of their own.
    if (!row) return null;

    const child: Child = {
      id: row.id,
      name: row.name,
      avatar: row.avatar ?? undefined,
      picture: row.picture,
      age: row.age ?? 0,
      class: row.class ?? '',
      caregiverLabel: row.caregiver_label,
      points: row.points ?? 0,
      // Redeemed rewards are not part of the child's read scope yet; an empty
      // list is correct rather than invented.
      rewards: [],
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.updated_at ?? new Date().toISOString(),
    };

    const { data: taskRows } = await supabase
      .from('tasks')
      .select('id,child_id,title,description,category,points,status,due_date,created_at,completed_at,submitted_at,assigned_by_label,start_time,end_time')
      .order('created_at', { ascending: true });

    const tasks: Task[] = ((taskRows as unknown as TaskRow[] | null) ?? []).map((t) => ({
      id: t.id,
      childId: t.child_id ?? undefined,
      title: t.title,
      description: t.description ?? undefined,
      category: (t.category ?? 'chore') as TaskCategory,
      points: t.points ?? 0,
      status: asStatus(t.status),
      dueDate: t.due_date,
      createdAt: t.created_at ?? new Date().toISOString(),
      completedAt: t.completed_at,
      submittedAt: t.submitted_at,
      assignedByLabel: t.assigned_by_label,
      startTime: t.start_time,
      endTime: t.end_time,
    }));

    return {
      child,
      tasks,
      visualTheme: row.visual_theme === 'calm' ? 'calm' : 'vivid',
      reduceMotion: Boolean(row.reduce_motion),
    };
  } catch (err) {
    console.warn('[childSession] load failed:', err);
    return null;
  }
}

/**
 * Push a claimed task to the backend.
 *
 * Deliberately writes only `pending_approval`. The RLS policy pins the allowed
 * value anyway (a child setting 'completed' gets HTTP 403), so this is the
 * client agreeing with a rule the database already enforces.
 */
export async function submitTaskForApprovalRemote(taskId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'pending_approval', submitted_at: new Date().toISOString() } as never)
      .eq('id', taskId);
    if (error) {
      console.warn('[childSession] claim failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[childSession] claim failed:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// GOLD BY PERIOD
// ---------------------------------------------------------------------------

export interface GoldSummary {
  today: number;
  week: number;
  month: number;
  year: number;
  allTime: number;
}

/** Local midnight N periods back — streaks and totals follow the child's own day. */
function startOf(period: 'day' | 'week' | 'month' | 'year'): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'week') {
    // Week starts Monday, which is how a school week reads to a child.
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
  } else if (period === 'month') {
    d.setDate(1);
  } else if (period === 'year') {
    d.setMonth(0, 1);
  }
  return d.getTime();
}

/**
 * Gold earned per period.
 *
 * `allTime` comes from `children.points` — the authoritative running balance,
 * which already accounts for spending on rewards. The shorter periods are
 * summed from dated history instead, so they can never be derived from that
 * balance. The two therefore answer different questions: "what do I have" vs
 * "what did I earn this week".
 */
export async function loadGoldSummary(allTimePoints: number): Promise<GoldSummary> {
  const empty: GoldSummary = { today: 0, week: 0, month: 0, year: 0, allTime: allTimePoints };
  if (!isSupabaseConfigured()) return empty;

  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return empty;

    // RLS scopes both of these to the signed-in child.
    const [{ data: taskRows }, { data: progressRows }] = await Promise.all([
      supabase.from('tasks').select('points,completed_at').eq('status', 'completed'),
      db.from('learning_progress').select('gold_earned,progress_date'),
    ]);

    const events: Array<{ at: number; gold: number }> = [];

    for (const t of (taskRows as unknown as Array<{ points: number | null; completed_at: string | null }> | null) ?? []) {
      if (!t.completed_at) continue;
      const at = new Date(t.completed_at).getTime();
      if (!Number.isNaN(at)) events.push({ at, gold: t.points ?? 0 });
    }

    for (const p of (progressRows as unknown as Array<{ gold_earned: number | null; progress_date: string | null }> | null) ?? []) {
      if (!p.progress_date) continue;
      const at = new Date(p.progress_date).getTime();
      if (!Number.isNaN(at)) events.push({ at, gold: p.gold_earned ?? 0 });
    }

    const sumSince = (from: number) =>
      events.reduce((total, e) => (e.at >= from ? total + e.gold : total), 0);

    return {
      today: sumSince(startOf('day')),
      week: sumSince(startOf('week')),
      month: sumSince(startOf('month')),
      year: sumSince(startOf('year')),
      allTime: allTimePoints,
    };
  } catch (err) {
    console.warn('[childSession] gold summary failed:', err);
    return empty;
  }
}

// ---------------------------------------------------------------------------
// REWARDS
// ---------------------------------------------------------------------------

export type RewardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'gold_target' | 'spend';

export interface ChildReward {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  period: RewardPeriod;
  /** Points to spend, for 'spend' and the recurring periods. */
  pointsRequired: number | null;
  /** All-time gold needed, for 'gold_target' only. */
  goldTarget: number | null;
  redeemed: boolean;
}

/**
 * Rewards this child can see.
 *
 * RLS (migration 014) already limits the result to rewards assigned to them or
 * to the whole family, so no client-side filtering by child is needed.
 */
export async function loadChildRewards(): Promise<ChildReward[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await db
      .from('rewards')
      .select('id,title,description,image_url,points_required,reward_period,gold_target,redeemed')
      .order('created_at');

    return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
      id: String(r.id),
      title: String(r.title ?? ''),
      description: (r.description as string) ?? null,
      imageUrl: (r.image_url as string) ?? null,
      period: ((r.reward_period as RewardPeriod) ?? 'spend'),
      pointsRequired: r.points_required == null ? null : Number(r.points_required),
      goldTarget: r.gold_target == null ? null : Number(r.gold_target),
      redeemed: Boolean(r.redeemed),
    }));
  } catch (err) {
    console.warn('[childSession] rewards load failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// ABOUT ME
// ---------------------------------------------------------------------------

export interface AboutPrompt {
  key: string;
  label: string;
  placeholder: string;
  emoji: string;
  /** Longer answers get a taller field. */
  multiline?: boolean;
}

/**
 * What a child can tell their family.
 *
 * Mostly light — favourites are easy to answer and make the screen feel like
 * theirs. The last two are the reason this exists: "proud of" and "find hard"
 * give a parent something to respond to that a child may never say out loud.
 */
export const ABOUT_PROMPTS: AboutPrompt[] = [
  { key: 'colour', label: 'My favourite colour', placeholder: 'Blue!', emoji: '🎨' },
  { key: 'food', label: 'My favourite food', placeholder: 'Jollof rice', emoji: '🍽️' },
  { key: 'animal', label: 'My favourite animal', placeholder: 'Cheetah', emoji: '🦁' },
  { key: 'film', label: 'My favourite film or show', placeholder: 'Moana', emoji: '🎬' },
  { key: 'game', label: 'My favourite game', placeholder: 'Football', emoji: '🎮' },
  { key: 'subject', label: 'My favourite subject', placeholder: 'Science', emoji: '📚' },
  { key: 'friend', label: 'My best friend', placeholder: "Who's your favourite person?", emoji: '🤝' },
  { key: 'dream', label: 'When I grow up I want to be', placeholder: 'An astronaut', emoji: '🚀' },
  { key: 'proud', label: "Something I'm proud of", placeholder: 'I learned to swim!', emoji: '⭐', multiline: true },
  { key: 'hard', label: 'Something I find hard', placeholder: "It's okay to say", emoji: '💭', multiline: true },
];

export type AboutAnswers = Record<string, string>;

export async function loadAboutMe(): Promise<AboutAnswers> {
  if (!isSupabaseConfigured()) return {};
  try {
    // RLS limits this to the signed-in child's own rows.
    const { data } = await db.from('child_about').select('field_key,value');
    const answers: AboutAnswers = {};
    for (const row of (data as Array<{ field_key: string; value: string | null }> | null) ?? []) {
      if (row.value) answers[row.field_key] = row.value;
    }
    return answers;
  } catch (err) {
    console.warn('[childSession] about-me load failed:', err);
    return {};
  }
}

/** Save one answer. Upserts on (child_id, field_key), so editing replaces. */
export async function saveAboutMe(childId: string, parentId: string | null, key: string, value: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await db.from('child_about').upsert(
      {
        child_id: childId,
        parent_id: parentId,
        field_key: key,
        value: value.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id,field_key' }
    );
    if (error) {
      console.warn('[childSession] about-me save failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[childSession] about-me save failed:', err);
    return false;
  }
}

/** The child's parent id, needed to satisfy the parent_id column on writes. */
export async function loadChildParentId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await db.from('children').select('parent_id').limit(1);
    const row = (data as Array<{ parent_id: string | null }> | null)?.[0];
    return row?.parent_id ?? null;
  } catch {
    return null;
  }
}

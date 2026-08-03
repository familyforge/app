// Cross-device persistence for the parent app.
//
// The app is local-first: every store lives in Zustand behind AsyncStorage. That
// is the right shape for offline use, but two halves were missing, so signing in
// on a second device produced what looked like a brand new account:
//
//   PULL — `pullAllDataFromCloud` fetched everything and RETURNED it, and
//          `pullFromCloud` in sync-provider discarded the result. Data arrived
//          on the new device and was dropped on the floor.
//   PUSH — `syncNow` only drains a queue that nothing populates for ordinary
//          edits, and `profile-store.updateProfile` never wrote to the cloud at
//          all. So a renamed parent or a new avatar stayed on one handset.
//
// This module closes both. It deliberately sits OUTSIDE the stores and
// subscribes to them, rather than making every store cloud-aware: the stores
// stay simple and offline-first, and sync is one thing that can be reasoned
// about and switched off.

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { isRemoteUrl } from './storage';
import { useAppStore } from '../state/app-store';
import { useProfileStore } from '../state/profile-store';
import { useCalendarStore } from '../state/calendar-store';
import { useDeadlinesStore } from '../state/deadlines-store';
import { useLearningStore } from '../state/learning-store';
import type { Child, Task } from '../types';

/** Rows come back as loose records; the generated types are stale. */
type Row = Record<string, unknown>;
const str = (v: unknown, fallback = '') => (v == null ? fallback : String(v));
const num = (v: unknown, fallback = 0) => (v == null ? fallback : Number(v));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// The generated database.types.ts is stale (it predates several migrations), so
// these writes go through an untyped view of the client. Regenerating the types
// would let this be removed.
const db = supabase as unknown as SupabaseClient;

/** Wait this long after the last change before writing, to batch rapid edits. */
const DEBOUNCE_MS = 1500;

let started = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastSerialised = '';

async function currentParentId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// PULL
// ---------------------------------------------------------------------------

/**
 * Load this parent's cloud data into the local stores.
 *
 * Call after sign-in and on app start. Cloud is treated as the source of truth
 * for the initial load — a fresh device has nothing local worth preserving, and
 * a returning device is reconciling against what it last pushed.
 */
export async function hydrateFromCloud(): Promise<{ ok: boolean; children: number; tasks: number }> {
  if (!isSupabaseConfigured()) return { ok: false, children: 0, tasks: 0 };

  const parentId = await currentParentId();
  if (!parentId) return { ok: false, children: 0, tasks: 0 };

  try {
    const [{ data: parentRow }, { data: childRows }] = await Promise.all([
      db.from('parents').select('*').eq('id', parentId).maybeSingle(),
      db.from('children').select('*').eq('parent_id', parentId).order('created_at'),
    ]);

    const children: Child[] = ((childRows as Record<string, unknown>[] | null) ?? []).map((r) => ({
      id: String(r.id),
      parentId: r.parent_id ? String(r.parent_id) : undefined,
      name: String(r.name ?? ''),
      nickname: (r.nickname as string) ?? undefined,
      avatar: (r.avatar as string) ?? undefined,
      picture: (r.picture as string) ?? null,
      age: Number(r.age ?? 0),
      birthday: (r.birthday as string) ?? null,
      class: String(r.class ?? ''),
      schoolSchedule: (r.school_schedule as string) ?? undefined,
      interests: (r.interests as string[]) ?? undefined,
      learningStyle: (r.learning_style as string) ?? undefined,
      specialNeeds: (r.special_needs as string) ?? undefined,
      archived: Boolean(r.archived),
      points: Number(r.points ?? 0),
      rewards: [],
      caregiverLabel: (r.caregiver_label as string) ?? null,
      createdAt: String(r.created_at ?? new Date().toISOString()),
      updatedAt: String(r.updated_at ?? new Date().toISOString()),
    }));

    // Tasks are scoped by RLS to this parent's children, so no extra filter.
    const { data: taskRows } = await db.from('tasks').select('*').order('created_at');

    const tasks: Task[] = ((taskRows as Record<string, unknown>[] | null) ?? []).map((r) => ({
      id: String(r.id),
      childId: r.child_id ? String(r.child_id) : undefined,
      title: String(r.title ?? ''),
      description: (r.description as string) ?? undefined,
      category: (r.category as Task['category']) ?? 'chore',
      points: Number(r.points ?? 0),
      negativePoints: r.negative_points ? Number(r.negative_points) : undefined,
      status: (r.status as Task['status']) ?? 'pending',
      dueDate: (r.due_date as string) ?? null,
      startTime: (r.start_time as string) ?? null,
      endTime: (r.end_time as string) ?? null,
      assignedByLabel: (r.assigned_by_label as string) ?? null,
      createdAt: String(r.created_at ?? new Date().toISOString()),
      completedAt: (r.completed_at as string) ?? null,
      submittedAt: (r.submitted_at as string) ?? null,
    }));

    // MERGE rather than replace.
    //
    // Replacing wholesale meant anything created locally but not yet pushed —
    // a child added on a plane, a task made seconds before launch — was deleted
    // the moment the cloud answered. Cloud wins for rows that exist in both
    // (it is the shared truth), and purely local rows survive until they sync.
    const local = useAppStore.getState();

    const mergeById = <T extends { id: string }>(remote: T[], localRows: T[]): T[] => {
      if (remote.length === 0) return localRows;
      const byId = new Map(localRows.map((r) => [r.id, r]));
      for (const row of remote) byId.set(row.id, row);
      return Array.from(byId.values());
    };

    const mergedChildren = mergeById(children, local.children);
    const mergedTasks = mergeById(tasks, local.tasks);

    if (mergedChildren.length > 0 || mergedTasks.length > 0) {
      useAppStore.setState({ children: mergedChildren, tasks: mergedTasks });
    }

    if (parentRow) {
      const p = parentRow as Record<string, unknown>;

      // Only carry across fields the cloud actually HAS.
      //
      // updateProfile does `{ ...profile, ...updates }`, and object spread keeps
      // keys whose value is undefined — so passing `avatarUrl: undefined`
      // overwrote a good local value with nothing. Because this runs on every
      // launch, it was erasing the parent's name, email and photo each time the
      // cloud row was empty. Never let a blank remote destroy local data.
      const patch: Record<string, unknown> = {};
      if (typeof p.name === 'string' && p.name.trim()) patch.name = p.name;
      if (typeof p.email === 'string' && p.email.trim()) patch.email = p.email;
      if (typeof p.avatar_url === 'string' && p.avatar_url.trim()) {
        patch.avatarUrl = p.avatar_url;
      }
      if (p.plan_code) {
        patch.plan = p.plan_code === 'forge' ? 'forge' : p.plan_code === 'pro' ? 'pro' : 'free';
      }
      if (Object.keys(patch).length > 0) {
        useProfileStore.getState().updateProfile(patch as never);
      }
    }

    // ---- Calendar, deadlines and learning -------------------------------
    const [
      { data: eventRows },
      { data: deadlineRows },
      { data: learnTaskRows },
      { data: progressRows },
      { data: examRows },
    ] = await Promise.all([
      db.from('calendar_events').select('*').eq('parent_id', parentId),
      db.from('deadlines').select('*').eq('parent_id', parentId),
      db.from('learning_tasks').select('*').eq('parent_id', parentId),
      db.from('learning_progress').select('*').eq('parent_id', parentId),
      db.from('learning_exam_sessions').select('*').eq('parent_id', parentId),
    ]);

    const events = ((eventRows as Row[] | null) ?? []).map((r) => ({
      id: str(r.id),
      title: str(r.title),
      description: (r.description as string) ?? undefined,
      category: str(r.category, 'other'),
      color: str(r.color),
      date: str(r.event_date).slice(0, 10),
      startTime: (r.start_time as string) ?? undefined,
      endTime: (r.end_time as string) ?? undefined,
      allDay: Boolean(r.all_day),
      recurrence: str(r.recurrence, 'none'),
      recurrenceEndDate: r.recurrence_end_date ? str(r.recurrence_end_date).slice(0, 10) : undefined,
      childIds: arr<string>(r.child_ids),
      isFamily: Boolean(r.is_family),
      reminder: r.reminder_minutes == null ? undefined : num(r.reminder_minutes),
      createdBy: (r.created_by as string) ?? undefined,
      createdAt: str(r.created_at, new Date().toISOString()),
    }));
    if (events.length > 0) useCalendarStore.setState({ events } as never);

    const deadlines = ((deadlineRows as Row[] | null) ?? []).map((r) => ({
      id: str(r.id),
      title: str(r.title),
      description: (r.description as string) ?? undefined,
      category: str(r.category, 'other'),
      priority: str(r.priority, 'medium'),
      dueDate: str(r.due_date).slice(0, 10),
      dueTime: (r.due_time as string) ?? undefined,
      childIds: arr<string>(r.child_ids),
      isCompleted: Boolean(r.is_completed),
      completedAt: (r.completed_at as string) ?? undefined,
      reminder: r.reminder_days == null ? undefined : num(r.reminder_days),
      createdAt: str(r.created_at, new Date().toISOString()),
    }));
    if (deadlines.length > 0) useDeadlinesStore.setState({ deadlines } as never);

    const learningTasks = ((learnTaskRows as Row[] | null) ?? []).map((r) => ({
      id: str(r.id),
      categoryId: str(r.category_id),
      title: str(r.title),
      description: str(r.description),
      isDefault: Boolean(r.is_default),
      isEnabled: Boolean(r.is_enabled),
      points: num(r.points),
      hasNegativePoints: Boolean(r.has_negative_points),
      frequency: str(r.frequency, 'daily'),
      daysOfWeek: arr<number>(r.days_of_week),
      timeOfDay: (r.time_of_day as string) ?? undefined,
      appliesTo: str(r.applies_to, 'all'),
      selectedChildIds: arr<string>(r.selected_child_ids),
      isQuestionBased: Boolean(r.is_question_based),
      questionsPerSession: num(r.questions_per_session),
      createdAt: str(r.created_at, new Date().toISOString()),
    }));

    const progress = ((progressRows as Row[] | null) ?? []).map((r) => ({
      childId: str(r.child_id),
      categoryId: str(r.category_id),
      taskId: str(r.task_id),
      date: str(r.progress_date).slice(0, 10),
      completed: Boolean(r.completed),
      questionsAnswered: num(r.questions_answered),
      correctAnswers: num(r.correct_answers),
      pointsEarned: num(r.points_earned),
      goldEarned: num(r.gold_earned),
      completedAt: (r.completed_at as string) ?? undefined,
    }));

    const examSessions = ((examRows as Row[] | null) ?? []).map((r) => ({
      id: str(r.id),
      childId: str(r.child_id),
      categoryId: str(r.category_id),
      academicYear: num(r.academic_year),
      date: str(r.session_date).slice(0, 10),
      questions: arr<unknown>(r.questions),
      totalGold: num(r.total_gold),
      totalCorrect: num(r.total_correct),
      rewardPoints: num(r.reward_points),
      completedAt: str(r.completed_at, new Date().toISOString()),
    }));

    // Learning tasks ship with local defaults, so only replace them when the
    // cloud genuinely has some — otherwise a fresh account would lose them.
    const learningPatch: Record<string, unknown> = {};
    if (learningTasks.length > 0) learningPatch.tasks = learningTasks;
    if (progress.length > 0) learningPatch.progress = progress;
    if (examSessions.length > 0) learningPatch.examSessions = examSessions;
    if (Object.keys(learningPatch).length > 0) {
      useLearningStore.setState(learningPatch as never);
    }

    // Seed the change detector so hydration does not immediately push back what
    // it just pulled.
    lastSerialised = serialise();

    return { ok: true, children: children.length, tasks: tasks.length };
  } catch (err) {
    console.warn('[cloud-sync] hydrate failed:', err);
    return { ok: false, children: 0, tasks: 0 };
  }
}

// ---------------------------------------------------------------------------
// PUSH
// ---------------------------------------------------------------------------

function serialise(): string {
  const { children, tasks } = useAppStore.getState();
  const { profile } = useProfileStore.getState();
  const { events } = useCalendarStore.getState();
  const { deadlines } = useDeadlinesStore.getState();
  const learning = useLearningStore.getState();
  return JSON.stringify({
    c: children.map((c) => [c.id, c.name, c.picture, c.age, c.class, c.points, c.archived]),
    t: tasks.map((t) => [t.id, t.title, t.status, t.points, t.dueDate, t.endTime, t.childId]),
    p: [profile.name, profile.email, profile.avatarUrl, profile.plan],
    e: events.map((e) => [e.id, e.title, e.date, e.startTime, e.allDay, e.isFamily]),
    d: deadlines.map((d) => [d.id, d.title, d.dueDate, d.isCompleted, d.priority]),
    lt: learning.tasks.map((t) => [t.id, t.title, t.isEnabled, t.points]),
    lp: learning.progress.map((x) => [x.childId, x.taskId, x.date, x.completed, x.goldEarned]),
    ls: learning.examSessions.map((x) => [x.id, x.totalGold, x.completedAt]),
  });
}

async function pushNow(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const parentId = await currentParentId();
  if (!parentId) return;

  const { children, tasks } = useAppStore.getState();
  const { profile } = useProfileStore.getState();

  try {
    await db.from('parents').update({
      name: profile.name,
      // Column added in migration 019. Before it existed this whole update was
      // rejected, which is why a parent's name and picture never synced.
      //
      // Only ever store a real URL. A file:// path is a sandbox location on one
      // handset — writing it to the cloud would hand every other device a value
      // it can never resolve.
      avatar_url: isRemoteUrl(profile.avatarUrl) ? profile.avatarUrl : null,
      plan_code: profile.plan,
      updated_at: new Date().toISOString(),
    }).eq('id', parentId);

    if (children.length > 0) {
      await db.from('children').upsert(
        children.map((c) => ({
          id: c.id,
          parent_id: parentId,
          name: c.name,
          nickname: c.nickname ?? null,
          picture: isRemoteUrl(c.picture) ? c.picture : null,
          avatar: c.avatar ?? null,
          age: c.age,
          birthday: c.birthday ?? null,
          class: c.class || null,
          school_schedule: c.schoolSchedule ?? null,
          interests: c.interests ?? null,
          learning_style: c.learningStyle ?? null,
          special_needs: c.specialNeeds ?? null,
          archived: c.archived ?? false,
          points: c.points,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    if (tasks.length > 0) {
      // Attribute new tasks to whatever this parent's children call them, so the
      // Kids app can say "from Dad" rather than "from your grown-up".
      const { data: me } = await db
        .from('parents')
        .select('caregiver_label')
        .eq('id', parentId)
        .maybeSingle();
      const label = (me as { caregiver_label?: string } | null)?.caregiver_label ?? null;

      await db.from('tasks').upsert(
        tasks
          // A task with no child cannot satisfy the RLS policy, which checks
          // ownership through children.
          .filter((t) => Boolean(t.childId))
          .map((t) => ({
            id: t.id,
            child_id: t.childId,
            title: t.title,
            description: t.description ?? null,
            category: t.category,
            points: t.points,
            negative_points: t.negativePoints ?? 0,
            status: t.status,
            due_date: t.dueDate ?? null,
            start_time: t.startTime ?? null,
            end_time: t.endTime ?? null,
            assigned_by_label: t.assignedByLabel ?? label,
            completed_at: t.completedAt ?? null,
            submitted_at: t.submittedAt ?? null,
          }))
      );
    }
    // ---- Calendar, deadlines, learning --------------------------------
    const { events } = useCalendarStore.getState();
    const { deadlines } = useDeadlinesStore.getState();
    const learning = useLearningStore.getState();
    const childIds = new Set(children.map((c) => c.id));
    const now = new Date().toISOString();

    if (events.length > 0) {
      await db.from('calendar_events').upsert(
        events.map((e) => ({
          id: e.id,
          parent_id: parentId,
          title: e.title,
          description: e.description ?? null,
          category: e.category,
          color: e.color ?? null,
          event_date: e.date,
          start_time: e.startTime ?? null,
          end_time: e.endTime ?? null,
          all_day: e.allDay,
          recurrence: e.recurrence,
          recurrence_end_date: e.recurrenceEndDate ?? null,
          // Drop ids for children that no longer exist, or the uuid[] write
          // fails the foreign-key expectations of anything reading it later.
          child_ids: (e.childIds ?? []).filter((id) => childIds.has(id)),
          is_family: e.isFamily,
          reminder_minutes: e.reminder ?? null,
          created_by: e.createdBy ?? null,
          updated_at: now,
        }))
      );
    }

    if (deadlines.length > 0) {
      await db.from('deadlines').upsert(
        deadlines.map((d) => ({
          id: d.id,
          parent_id: parentId,
          title: d.title,
          description: d.description ?? null,
          category: d.category,
          priority: d.priority,
          due_date: d.dueDate,
          due_time: d.dueTime ?? null,
          child_ids: (d.childIds ?? []).filter((id) => childIds.has(id)),
          is_completed: d.isCompleted,
          completed_at: d.completedAt ?? null,
          reminder_days: d.reminder ?? null,
          updated_at: now,
        }))
      );
    }

    if (learning.tasks.length > 0) {
      await db.from('learning_tasks').upsert(
        learning.tasks.map((t) => ({
          id: t.id,
          parent_id: parentId,
          category_id: t.categoryId,
          title: t.title,
          description: t.description ?? null,
          is_default: t.isDefault,
          is_enabled: t.isEnabled,
          points: t.points,
          has_negative_points: t.hasNegativePoints,
          frequency: t.frequency,
          days_of_week: t.daysOfWeek ?? [],
          time_of_day: t.timeOfDay ?? null,
          applies_to: t.appliesTo,
          selected_child_ids: (t.selectedChildIds ?? []).filter((id) => childIds.has(id)),
          is_question_based: t.isQuestionBased,
          questions_per_session: t.questionsPerSession,
          updated_at: now,
        }))
      );
    }

    // Progress and exam rows reference a child, so anything for a child this
    // device no longer knows about is skipped rather than failing the batch.
    const liveProgress = learning.progress.filter((x) => childIds.has(x.childId) && x.taskId);
    if (liveProgress.length > 0) {
      await db.from('learning_progress').upsert(
        liveProgress.map((x) => ({
          child_id: x.childId,
          parent_id: parentId,
          task_id: x.taskId,
          category_id: x.categoryId,
          progress_date: x.date,
          completed: x.completed,
          questions_answered: x.questionsAnswered,
          correct_answers: x.correctAnswers,
          points_earned: x.pointsEarned,
          gold_earned: x.goldEarned,
          completed_at: x.completedAt ?? null,
          updated_at: now,
        })),
        // Matches the UNIQUE in migration 018, so re-pushing the same day's
        // progress updates rather than duplicating.
        { onConflict: 'child_id,task_id,progress_date' }
      );
    }

    const liveSessions = learning.examSessions.filter((x) => childIds.has(x.childId));
    if (liveSessions.length > 0) {
      await db.from('learning_exam_sessions').upsert(
        liveSessions.map((x) => ({
          id: x.id,
          child_id: x.childId,
          parent_id: parentId,
          category_id: x.categoryId,
          academic_year: x.academicYear ?? null,
          session_date: x.date,
          questions: x.questions ?? [],
          total_gold: x.totalGold,
          total_correct: x.totalCorrect,
          reward_points: x.rewardPoints,
          completed_at: x.completedAt,
        }))
      );
    }
    const rewards = useAppStore.getState().rewards;
    if (rewards.length > 0) {
      await db.from('rewards').upsert(
        rewards.map((r) => ({
          id: r.id,
          child_id: r.childId ?? null,
          parent_id: parentId,
          title: r.title,
          description: r.description ?? null,
          image_url: isRemoteUrl(r.imageUrl) ? r.imageUrl : null,
          // A milestone reward has a target, not a price, so points_required is
          // deliberately null there rather than 0 — the constraint enforces it.
          points_required: r.period === 'gold_target' ? null : r.pointsCost,
          reward_period: r.period ?? 'spend',
          gold_target: r.period === 'gold_target' ? r.goldTarget ?? null : null,
          redeemed: r.redeemed ?? false,
          updated_at: new Date().toISOString(),
        }))
      );
    }
  } catch (err) {
    console.warn('[cloud-sync] push failed:', err);
  }
}

/**
 * Watch the local stores and mirror changes to Supabase.
 *
 * Debounced, and compares a cheap projection of the state so that unrelated
 * store churn (a modal opening, a filter changing) does not trigger a write.
 */
export function startCloudSync(): () => void {
  if (started) return () => undefined;
  started = true;

  lastSerialised = serialise();

  const onChange = () => {
    const next = serialise();
    if (next === lastSerialised) return;
    lastSerialised = next;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { void pushNow(); }, DEBOUNCE_MS);
  };

  const unsubApp = useAppStore.subscribe(onChange);
  const unsubProfile = useProfileStore.subscribe(onChange);

  return () => {
    started = false;
    if (timer) clearTimeout(timer);
    unsubApp();
    unsubProfile();
  };
}

/** Force an immediate write — used on sign-out and before switching accounts. */
export async function flushCloudSync(): Promise<void> {
  if (timer) clearTimeout(timer);
  await pushNow();
}

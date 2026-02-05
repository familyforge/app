// Pro Parenting App - Profile Sync API

import { supabase, isSupabaseConfigured } from "./supabase";
import { requireAuthUserId, throwIfSupabaseError } from "./helpers";
import type { InsertTables, Json } from "./database.types";
import type {
  ParentProfile,
  Routine,
  Goal,
  Preferences,
  NotificationSettings,
  PrivacySettings,
} from "../state/profile-store";

interface SyncProfilePayload {
  profile: ParentProfile;
  routines: Routine[];
  goals: Goal[];
  preferences: Preferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export async function syncProfileData(payload: SyncProfilePayload, parentId?: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const resolvedParentId = parentId ?? (await requireAuthUserId());

  const profileUpsert: InsertTables<"parent_profiles"> = {
    parent_id: resolvedParentId,
    name: payload.profile.name,
    avatar_url: payload.profile.avatarUrl || null,
    timezone: payload.profile.country || null, // Using country in timezone column for now
    language: payload.profile.language || null,
    role: payload.profile.role || null,
    tone: payload.profile.tone || null,
    goal: payload.profile.parentalGoal || null, // Using parentalGoal in goal column
    preferences: payload.preferences as unknown as Json,
    notifications: payload.notifications as unknown as Json,
    privacy: payload.privacy as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  const profileQuery = supabase.from("parent_profiles") as unknown as {
    upsert: (
      values: InsertTables<"parent_profiles">,
      options?: { onConflict?: string }
    ) => Promise<{ error: { message: string } | null }>;
  };

  const { error: profileError } = await profileQuery.upsert(profileUpsert, { onConflict: "parent_id" });

  throwIfSupabaseError(profileError, "Failed to sync profile");

  const { error: deleteRoutinesError } = await supabase
    .from("parent_routines")
    .delete()
    .eq("parent_id", resolvedParentId);

  throwIfSupabaseError(deleteRoutinesError, "Failed to clear routines");

  if (payload.routines.length > 0) {
    const routineRows: InsertTables<"parent_routines">[] = payload.routines.map((routine) => ({
      parent_id: resolvedParentId,
      type: routine.type,
      title: routine.title,
      steps: routine.steps,
      reminder_time: routine.reminderTime,
      reminder_enabled: routine.reminderEnabled,
      streak: routine.streak,
      last_completed_date: routine.lastCompletedDate,
      updated_at: new Date().toISOString(),
    }));

    const { error: routineError } = await supabase.from("parent_routines").insert(routineRows as never);
    throwIfSupabaseError(routineError, "Failed to sync routines");
  }

  const { error: deleteGoalsError } = await supabase
    .from("parent_goals")
    .delete()
    .eq("parent_id", resolvedParentId);

  throwIfSupabaseError(deleteGoalsError, "Failed to clear goals");

  if (payload.goals.length > 0) {
    const goalRows: InsertTables<"parent_goals">[] = payload.goals.map((goal) => ({
      parent_id: resolvedParentId,
      title: goal.title,
      description: goal.description,
      target_days: goal.targetDays,
      current_streak: goal.currentStreak,
      updated_at: new Date().toISOString(),
    }));

    const { error: goalError } = await supabase.from("parent_goals").insert(goalRows as never);
    throwIfSupabaseError(goalError, "Failed to sync goals");
  }
}

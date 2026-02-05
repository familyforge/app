// Pro Parenting Admin - Analytics API

import { supabase } from '../supabase';
import { throwIfSupabaseError } from './helpers';

export interface AdminAnalytics {
  totalParents: number;
  totalChildren: number;
  totalTasksCompleted: number;
  totalPointsEarned: number;
  totalRewardsRedeemed: number;
  completionRate: number;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [{ count: parentCount, error: parentsError },
    { count: childCount, error: childrenError },
    { count: completedTasksCount, error: tasksError },
    { data: pointsRows, error: pointsError },
    { count: rewardsCount, error: rewardsError },
    { count: totalTasksCount, error: totalTasksError }]
    = await Promise.all([
      supabase.from('parents').select('*', { count: 'exact', head: true }),
      supabase.from('children').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('children').select('points'),
      supabase.from('rewards').select('*', { count: 'exact', head: true }).eq('redeemed', true),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
    ]);

  throwIfSupabaseError(parentsError, 'Failed to count parents');
  throwIfSupabaseError(childrenError, 'Failed to count children');
  throwIfSupabaseError(tasksError, 'Failed to count completed tasks');
  throwIfSupabaseError(pointsError, 'Failed to sum points');
  throwIfSupabaseError(rewardsError, 'Failed to count rewards redeemed');
  throwIfSupabaseError(totalTasksError, 'Failed to count total tasks');

  const totalPointsEarned = (pointsRows ?? []).reduce((sum, row) => {
    const points = (row as { points: number }).points ?? 0;
    return sum + points;
  }, 0);

  const totalTasks = totalTasksCount ?? 0;
  const completedTasks = completedTasksCount ?? 0;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  return {
    totalParents: parentCount ?? 0,
    totalChildren: childCount ?? 0,
    totalTasksCompleted: completedTasks,
    totalPointsEarned,
    totalRewardsRedeemed: rewardsCount ?? 0,
    completionRate,
  };
}

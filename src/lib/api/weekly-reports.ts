// FamilyForge - Weekly Report Service
// Generates and sends weekly PDF reports every Sunday

import { supabase } from './supabase';
import { sendWeeklyReport, WeeklyReportData, EmailRecipient } from './email';

const db = supabase as unknown as {
  from: (table: string) => any;
};

/**
 * Get users who have weekly reports enabled
 */
export async function getUsersWithWeeklyReports(): Promise<{
  id: string;
  name: string;
  email: string;
}[]> {
  try {
    const { data, error } = await db
      .from('parents')
      .select('id, name, email, notification_settings')
      .eq('notification_settings->weeklyReports', true);

    if (error) {
      console.error('Error fetching users for weekly reports:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUsersWithWeeklyReports:', error);
    return [];
  }
}

/**
 * Generate weekly report data for a family
 */
export async function generateWeeklyReportData(
  parentId: string
): Promise<WeeklyReportData | null> {
  try {
    // Calculate week dates (Sunday to Saturday)
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay()); // Last Sunday
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6); // Previous Monday

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Get parent info
    const { data: parent } = await db
      .from('parents')
      .select('name')
      .eq('id', parentId)
      .single();

    // Get children
    const { data: children } = await db
      .from('children')
      .select('id, name, points')
      .eq('parent_id', parentId);

    const safeChildren = (children ?? []) as Array<{ id: string; name: string; points?: number }>;

    if (safeChildren.length === 0) {
      return null;
    }

    const childIds = safeChildren.map((c) => c.id);

    // Get task completions for the week
    const { data: taskCompletions } = await db
      .from('task_history')
      .select('child_id, points_earned, completed_at')
      .in('child_id', childIds)
      .gte('completed_at', weekStartStr)
      .lte('completed_at', weekEndStr + 'T23:59:59');

    // Get reward redemptions for the week
    const { data: rewardRedemptions } = await db
      .from('reward_history')
      .select('child_id, redeemed_at')
      .in('child_id', childIds)
      .gte('redeemed_at', weekStartStr)
      .lte('redeemed_at', weekEndStr + 'T23:59:59');

    // Get total tasks for completion rate
    const { data: allTasks } = await db
      .from('tasks')
      .select('id, assigned_to')
      .eq('parent_id', parentId);

    // Calculate stats per child
    const safeCompletions = (taskCompletions ?? []) as Array<{ child_id: string; points_earned?: number; completed_at: string }>;
    const safeRedemptions = (rewardRedemptions ?? []) as Array<{ child_id: string; redeemed_at: string }>;
    const safeTasks = (allTasks ?? []) as Array<{ id: string; assigned_to: string }>;

    const childrenStats = safeChildren.map((child) => {
      const childCompletions = safeCompletions.filter((t) => t.child_id === child.id);
      const childRedemptions = safeRedemptions.filter((r) => r.child_id === child.id);
      const childTasks = safeTasks.filter((t) => t.assigned_to === child.id || t.assigned_to === 'all');

      const pointsEarned = childCompletions.reduce((sum: number, t) => sum + (t.points_earned || 0), 0);

      return {
        name: child.name,
        tasksCompleted: childCompletions.length,
        tasksTotal: childTasks.length,
        pointsEarned,
        rewardsRedeemed: childRedemptions.length,
        streakDays: 0, // Would need streak tracking
        topAchievement: pointsEarned > 100 ? 'Point Champion!' : 
                        childCompletions.length > 10 ? 'Task Master!' : 'Keep Going!',
      };
    });

    // Calculate family stats
    const totalTasksCompleted = childrenStats.reduce((sum: number, c) => sum + c.tasksCompleted, 0);
    const totalPointsEarned = childrenStats.reduce((sum: number, c) => sum + c.pointsEarned, 0);
    const totalRewardsRedeemed = childrenStats.reduce((sum: number, c) => sum + c.rewardsRedeemed, 0);
    const totalTasks = childrenStats.reduce((sum: number, c) => sum + c.tasksTotal, 0);

    // Find most productive day
    const dayCompletions: Record<string, number> = {};
    safeCompletions.forEach((t) => {
      const day = new Date(t.completed_at).toLocaleDateString('en-US', { weekday: 'long' });
      dayCompletions[day] = (dayCompletions[day] || 0) + 1;
    });
    const mostProductiveDay = Object.entries(dayCompletions)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    return {
      familyName: parent?.name ? `${parent.name}'s Family` : 'Your Family',
      weekStartDate: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekEndDate: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      children: childrenStats,
      familyStats: {
        totalTasksCompleted,
        totalPointsEarned,
        totalRewardsRedeemed,
        mostProductiveDay,
        averageCompletionRate: totalTasks > 0 ? Math.round((totalTasksCompleted / totalTasks) * 100) : 0,
      },
    };
  } catch (error) {
    console.error('Error generating weekly report data:', error);
    return null;
  }
}

/**
 * Send weekly report to a user
 */
export async function sendUserWeeklyReport(
  userId: string,
  userEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reportData = await generateWeeklyReportData(userId);
    
    if (!reportData) {
      return { success: false, error: 'No data to report' };
    }

    // Generate PDF via Edge Function
    const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-pdf-report', {
      body: { reportData, userId },
    });

    if (pdfResult?.pdfUrl) {
      reportData.pdfUrl = pdfResult.pdfUrl;
    }

    const recipient: EmailRecipient = {
      email: userEmail,
      name: userName,
    };

    const result = await sendWeeklyReport(recipient, reportData);
    return result;
  } catch (error) {
    console.error('Error sending weekly report:', error);
    return { success: false, error: 'Failed to send report' };
  }
}

/**
 * Process all weekly reports (called by cron job every Sunday)
 */
export async function processAllWeeklyReports(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const users = await getUsersWithWeeklyReports();
  
  let successful = 0;
  let failed = 0;

  for (const user of users) {
    const result = await sendUserWeeklyReport(user.id, user.email, user.name);
    if (result.success) {
      successful++;
    } else {
      failed++;
      console.error(`Failed to send report to ${user.email}:`, result.error);
    }
  }

  return {
    processed: users.length,
    successful,
    failed,
  };
}

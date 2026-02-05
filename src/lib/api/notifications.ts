// FamilyForge - Notification Service
// Handles push notifications and email alerts for all family members

import { supabase } from './supabase';
import { 
  sendTaskReminder, 
  sendAchievementAlert, 
  TaskReminderData, 
  AchievementData,
  EmailRecipient 
} from './email';

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'guardian' | 'child';
  pushToken?: string;
  notificationSettings: {
    taskReminders: boolean;
    achievementAlerts: boolean;
    weeklyReports: boolean;
  };
}

const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

/**
 * Get all family members for a given parent
 */
export async function getFamilyMembers(parentId: string): Promise<FamilyMember[]> {
  try {
    // Get parent info
    const { data: parent, error: parentError } = await db
      .from('parents')
      .select('id, name, email, push_token, notification_settings')
      .eq('id', parentId)
      .single();

    if (parentError) {
      console.error('Error fetching parent:', parentError);
      return [];
    }

    // Get co-parents/guardians
    const { data: coParents, error: coParentsError } = await db
      .from('family_members')
      .select('id, name, email, role, push_token, notification_settings')
      .eq('family_id', parentId)
      .in('role', ['parent', 'guardian']);

    if (coParentsError) {
      console.error('Error fetching co-parents:', coParentsError);
    }

    // Get children with notification access
    const { data: children, error: childrenError } = await db
      .from('children')
      .select('id, name, email, push_token, notification_settings')
      .eq('parent_id', parentId)
      .not('email', 'is', null);

    if (childrenError) {
      console.error('Error fetching children:', childrenError);
    }

    const members: FamilyMember[] = [];

    // Add parent
    if (parent) {
      members.push({
        id: parent.id,
        name: parent.name,
        email: parent.email,
        role: 'parent',
        pushToken: parent.push_token,
        notificationSettings: parent.notification_settings || {
          taskReminders: true,
          achievementAlerts: true,
          weeklyReports: true,
        },
      });
    }

    // Add co-parents/guardians
    if (coParents) {
      for (const cp of coParents) {
        members.push({
          id: cp.id,
          name: cp.name,
          email: cp.email,
          role: cp.role as 'parent' | 'guardian',
          pushToken: cp.push_token,
          notificationSettings: cp.notification_settings || {
            taskReminders: true,
            achievementAlerts: true,
            weeklyReports: true,
          },
        });
      }
    }

    // Add children (only for task reminders, not other notifications)
    if (children) {
      for (const child of children) {
        if (child.email) {
          members.push({
            id: child.id,
            name: child.name,
            email: child.email,
            role: 'child',
            pushToken: child.push_token,
            notificationSettings: child.notification_settings || {
              taskReminders: true,
              achievementAlerts: true,
              weeklyReports: false, // Children don't get weekly reports
            },
          });
        }
      }
    }

    return members;
  } catch (error) {
    console.error('Error in getFamilyMembers:', error);
    return [];
  }
}

/**
 * Send task reminder to all relevant family members
 */
export async function notifyTaskReminder(
  parentId: string,
  taskData: TaskReminderData,
  targetChildId?: string
): Promise<{ success: boolean; sentTo: number }> {
  try {
    const members = await getFamilyMembers(parentId);
    
    // Filter members who should receive task reminders
    const recipients: EmailRecipient[] = members
      .filter((m) => {
        // If targeting a specific child, include them
        if (targetChildId && m.id === targetChildId) return true;
        // Parents and guardians always get task reminders if enabled
        if (m.role !== 'child' && m.notificationSettings.taskReminders) return true;
        return false;
      })
      .map((m) => ({ email: m.email, name: m.name }));

    if (recipients.length === 0) {
      return { success: true, sentTo: 0 };
    }

    const result = await sendTaskReminder(recipients, taskData);
    
    return { 
      success: result.success, 
      sentTo: result.success ? recipients.length : 0 
    };
  } catch (error) {
    console.error('Error in notifyTaskReminder:', error);
    return { success: false, sentTo: 0 };
  }
}

/**
 * Send achievement alert to all family members
 */
export async function notifyAchievement(
  parentId: string,
  achievementData: AchievementData
): Promise<{ success: boolean; sentTo: number }> {
  try {
    const members = await getFamilyMembers(parentId);
    
    // All family members who have achievement alerts enabled
    const recipients: EmailRecipient[] = members
      .filter((m) => m.notificationSettings.achievementAlerts)
      .map((m) => ({ email: m.email, name: m.name }));

    if (recipients.length === 0) {
      return { success: true, sentTo: 0 };
    }

    const result = await sendAchievementAlert(recipients, achievementData);
    
    return { 
      success: result.success, 
      sentTo: result.success ? recipients.length : 0 
    };
  } catch (error) {
    console.error('Error in notifyAchievement:', error);
    return { success: false, sentTo: 0 };
  }
}

/**
 * Check and trigger leaderboard achievements
 */
export async function checkLeaderboardAchievement(
  childId: string,
  parentId: string,
  childName: string,
  totalPoints: number
): Promise<void> {
  try {
    // Check country ranking
    const { data: parent } = await db
      .from('parents')
      .select('country')
      .eq('id', parentId)
      .single();

    if (!parent?.country) return;

    // Get country ranking
    const { data: countryRank } = await db
      .rpc('get_child_country_rank', { 
        child_id: childId, 
        country: parent.country 
      });

    // Get worldwide ranking
    const { data: worldRank } = await db
      .rpc('get_child_world_rank', { child_id: childId });

    // Check if in top 100 worldwide
    if (worldRank && worldRank <= 100) {
      await notifyAchievement(parentId, {
        childName,
        achievementType: 'leaderboard_rank',
        achievementTitle: 'Top 100 Worldwide! 🌍',
        achievementDetails: `${childName} is now ranked #${worldRank} in the world!`,
        newTotalPoints: totalPoints,
        rank: worldRank,
        rankScope: 'worldwide',
      });
    }
    // Check if in top 100 in country
    else if (countryRank && countryRank <= 100) {
      await notifyAchievement(parentId, {
        childName,
        achievementType: 'leaderboard_rank',
        achievementTitle: `Top 100 in ${parent.country}! 🏆`,
        achievementDetails: `${childName} is now ranked #${countryRank} in ${parent.country}!`,
        newTotalPoints: totalPoints,
        rank: countryRank,
        rankScope: 'country',
      });
    }
  } catch (error) {
    console.error('Error checking leaderboard achievement:', error);
  }
}

/**
 * Notify about completed task
 */
export async function notifyTaskCompleted(
  parentId: string,
  childName: string,
  taskTitle: string,
  pointsEarned: number,
  newTotalPoints: number
): Promise<void> {
  await notifyAchievement(parentId, {
    childName,
    achievementType: 'task_completed',
    achievementTitle: 'Task Completed! ✅',
    achievementDetails: `${childName} completed "${taskTitle}"`,
    pointsEarned,
    newTotalPoints,
  });
}

/**
 * Notify about reward redemption
 */
export async function notifyRewardRedeemed(
  parentId: string,
  childName: string,
  rewardTitle: string,
  pointsSpent: number
): Promise<void> {
  await notifyAchievement(parentId, {
    childName,
    achievementType: 'reward_earned',
    achievementTitle: 'Reward Claimed! 🎁',
    achievementDetails: `${childName} redeemed "${rewardTitle}" for ${pointsSpent} points`,
  });
}

/**
 * Notify about streak milestone
 */
export async function notifyStreakMilestone(
  parentId: string,
  childName: string,
  streakDays: number,
  streakType: string
): Promise<void> {
  // Only notify on significant milestones
  const milestones = [7, 14, 21, 30, 50, 100, 365];
  if (!milestones.includes(streakDays)) return;

  const emoji = streakDays >= 30 ? '🔥' : streakDays >= 14 ? '⭐' : '✨';
  
  await notifyAchievement(parentId, {
    childName,
    achievementType: 'streak_milestone',
    achievementTitle: `${streakDays}-Day Streak! ${emoji}`,
    achievementDetails: `${childName} has completed ${streakType} for ${streakDays} days in a row!`,
  });
}

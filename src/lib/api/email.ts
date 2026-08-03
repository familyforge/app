// ═══════════════════════════════════════════════════════════════════════════
// FamilyForge - Email Service API (Client Wrapper)
// ═══════════════════════════════════════════════════════════════════════════
//
// This file is a CLIENT-SIDE wrapper for calling the Email System Pro
// edge function at supabase/functions/send-email/
//
// ⚠️  DO NOT add email templates here. All templates are in:
//     supabase/functions/send-email/index.ts (Email System Pro)
//
// This file only defines TypeScript types and convenience functions for
// invoking the edge function from the React Native app.
//
// See: supabase/functions/send-email/WARNING.md for email system docs
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface TaskReminderData {
  taskTitle: string;
  taskDescription?: string;
  dueDate?: string;
  assignedTo: string;
  pointsValue: number;
}

export interface AchievementData {
  childName: string;
  achievementType: 'task_completed' | 'reward_earned' | 'streak_milestone' | 'leaderboard_rank' | 'weekly_goal';
  achievementTitle: string;
  achievementDetails: string;
  pointsEarned?: number;
  newTotalPoints?: number;
  rank?: number;
  rankScope?: 'country' | 'worldwide';
}

export interface WeeklyReportData {
  familyName: string;
  weekStartDate: string;
  weekEndDate: string;
  children: {
    name: string;
    tasksCompleted: number;
    tasksTotal: number;
    pointsEarned: number;
    rewardsRedeemed: number;
    streakDays: number;
    topAchievement: string;
  }[];
  familyStats: {
    totalTasksCompleted: number;
    totalPointsEarned: number;
    totalRewardsRedeemed: number;
    mostProductiveDay: string;
    averageCompletionRate: number;
  };
  pdfUrl?: string;
}

export interface FamilyInviteData {
  inviterName: string;
  familyName: string;
  inviteRole: 'parent' | 'guardian' | 'child';
  inviteCode: string;
  expiresAt: string;
}

// Email Template Types
export type EmailTemplate = 
  | 'task_reminder'
  | 'achievement_alert'
  | 'weekly_report'
  | 'family_invite'
  | 'password_reset'
  | 'welcome'
  | 'email_verification_code'
  | 'data_export_ready'
  | 'abandoned_payment_1hr'
  | 'abandoned_payment_24hr'
  | 'abandoned_payment_followup'
  | 'free_plan_weekly';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  recipient: EmailRecipient,
  parentName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'welcome' as EmailTemplate,
        recipients: [recipient],
        data: { parentName },
      },
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendWelcomeEmail:', error);
    return { success: false, error: 'Failed to send welcome email' };
  }
}

/**
 * Send email verification code after PIN creation
 */
export async function sendEmailVerificationCode(
  recipient: EmailRecipient,
  data: { parentName: string; code: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'email_verification_code' as EmailTemplate,
        recipients: [recipient],
        data,
      },
    });

    if (error) {
      console.error('Error sending email verification code:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendEmailVerificationCode:', error);
    return { success: false, error: 'Failed to send email verification code' };
  }
}

/**
 * Send abandoned payment reminder (1 hour after abandonment)
 */
export async function sendAbandonedPayment1hr(
  recipient: EmailRecipient,
  data: {
    parentName: string;
    planName: string;
    sessionId: string;
    specialOffer?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'abandoned_payment_1hr' as EmailTemplate,
        recipients: [recipient],
        data,
      },
    });

    if (error) {
      console.error('Error sending abandoned payment email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendAbandonedPayment1hr:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send abandoned payment reminder (24 hours after abandonment)
 */
export async function sendAbandonedPayment24hr(
  recipient: EmailRecipient,
  data: {
    parentName: string;
    planName: string;
    sessionId: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'abandoned_payment_24hr' as EmailTemplate,
        recipients: [recipient],
        data,
      },
    });

    if (error) {
      console.error('Error sending abandoned payment email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendAbandonedPayment24hr:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send abandoned payment follow-up (Day 2-7)
 */
export async function sendAbandonedPaymentFollowup(
  recipient: EmailRecipient,
  data: {
    parentName: string;
    planName: string;
    sessionId: string;
    dayNumber: number; // 2-7
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'abandoned_payment_followup' as EmailTemplate,
        recipients: [recipient],
        data,
      },
    });

    if (error) {
      console.error('Error sending abandoned payment followup:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendAbandonedPaymentFollowup:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send weekly "what you're missing" email to free plan users
 */
export async function sendFreePlanWeekly(
  recipient: EmailRecipient,
  data: {
    parentName: string;
    childName?: string;
    proPrice?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'free_plan_weekly' as EmailTemplate,
        recipients: [recipient],
        data,
      },
    });

    if (error) {
      console.error('Error sending free plan weekly email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendFreePlanWeekly:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send a task reminder email to family members
 */
export async function sendTaskReminder(
  recipients: EmailRecipient[],
  taskData: TaskReminderData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'task_reminder' as EmailTemplate,
        recipients,
        data: taskData,
      },
    });

    if (error) {
      console.error('Error sending task reminder:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendTaskReminder:', error);
    return { success: false, error: 'Failed to send reminder' };
  }
}

/**
 * Send achievement alerts to family members
 */
export async function sendAchievementAlert(
  recipients: EmailRecipient[],
  achievementData: AchievementData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'achievement_alert' as EmailTemplate,
        recipients,
        data: achievementData,
      },
    });

    if (error) {
      console.error('Error sending achievement alert:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendAchievementAlert:', error);
    return { success: false, error: 'Failed to send achievement alert' };
  }
}

/**
 * Send weekly report email with PDF attachment
 */
export async function sendWeeklyReport(
  recipient: EmailRecipient,
  reportData: WeeklyReportData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'weekly_report' as EmailTemplate,
        recipients: [recipient],
        data: reportData,
        attachPdf: true,
      },
    });

    if (error) {
      console.error('Error sending weekly report:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendWeeklyReport:', error);
    return { success: false, error: 'Failed to send weekly report' };
  }
}

/**
 * Send family invitation email
 */
export async function sendFamilyInvite(
  recipient: EmailRecipient,
  inviteData: FamilyInviteData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'family_invite' as EmailTemplate,
        recipients: [recipient],
        data: inviteData,
      },
    });

    if (error) {
      console.error('Error sending family invite:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendFamilyInvite:', error);
    return { success: false, error: 'Failed to send invitation' };
  }
}

/**
 * Send data export ready notification
 */
export async function sendDataExportReady(
  recipient: EmailRecipient,
  downloadUrl: string,
  expiresAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        template: 'data_export_ready' as EmailTemplate,
        recipients: [recipient],
        data: { downloadUrl, expiresAt },
      },
    });

    if (error) {
      console.error('Error sending data export notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in sendDataExportReady:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Get email preferences for a user
 */
/**
 * The six flags as the `email_preferences` table stores them.
 *
 * Deliberately snake_case: the table, the settings screen and this API were
 * previously three different shapes — the declared type was camelCase and
 * missing family_invites and security_alerts entirely, while the screen read
 * snake_case off the RESULT WRAPPER rather than the row. Every toggle therefore
 * read undefined and rendered off no matter what was stored, and saving wrote
 * keys the table does not have. One shape, matching the database.
 */
export interface EmailPreferenceFlags {
  task_reminders: boolean;
  achievement_alerts: boolean;
  weekly_reports: boolean;
  marketing_emails: boolean;
  family_invites: boolean;
  security_alerts: boolean;
}

const DEFAULT_EMAIL_PREFERENCES: EmailPreferenceFlags = {
  task_reminders: true,
  achievement_alerts: true,
  weekly_reports: true,
  marketing_emails: false,
  family_invites: true,
  security_alerts: true,
};

export async function getEmailPreferences(userId: string): Promise<{
  success: boolean;
  preferences?: EmailPreferenceFlags;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === 'PGRST116') {
        return { success: true, preferences: { ...DEFAULT_EMAIL_PREFERENCES } };
      }
      return { success: false, error: error.message };
    }

    // Columns are nullable, so a missing value falls back to the default rather
    // than surfacing null as "off".
    const row = (data ?? {}) as Partial<Record<keyof EmailPreferenceFlags, boolean | null>>;
    return {
      success: true,
      preferences: {
        task_reminders: row.task_reminders ?? DEFAULT_EMAIL_PREFERENCES.task_reminders,
        achievement_alerts: row.achievement_alerts ?? DEFAULT_EMAIL_PREFERENCES.achievement_alerts,
        weekly_reports: row.weekly_reports ?? DEFAULT_EMAIL_PREFERENCES.weekly_reports,
        marketing_emails: row.marketing_emails ?? DEFAULT_EMAIL_PREFERENCES.marketing_emails,
        family_invites: row.family_invites ?? DEFAULT_EMAIL_PREFERENCES.family_invites,
        security_alerts: row.security_alerts ?? DEFAULT_EMAIL_PREFERENCES.security_alerts,
      },
    };
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return { success: false, error: 'Failed to fetch preferences' };
  }
}

/**
 * Update email preferences for a user
 */
export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<EmailPreferenceFlags>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = supabase as unknown as {
      from: (table: string) => any;
    };
    const { error } = await db
      .from('email_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

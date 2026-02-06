// Pro Parenting Admin Dashboard - Supabase Client Configuration
// This file initializes the Supabase client for the web admin dashboard

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Database types (duplicated for admin to avoid cross-reference issues)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskType = 'chore' | 'exercise' | 'personal_care';
export type TaskStatus = 'pending' | 'completed' | 'skipped';
export type SubscriptionTier = 'free' | 'premium';
export type ThemeType = 'dark' | 'light' | 'system';
export type UserRole = 'parent' | 'admin' | 'superadmin';

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: UserRole;
          password_hash: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          role?: UserRole;
          password_hash?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: UserRole;
          password_hash?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          plan_prices: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          plan_prices: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          plan_prices?: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      parents: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          subscription_tier: SubscriptionTier;
          plan_code: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          password_hash: string;
          subscription_tier?: SubscriptionTier;
          plan_code?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          password_hash?: string;
          subscription_tier?: SubscriptionTier;
          plan_code?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          nickname: string | null;
          picture: string | null;
          avatar: string | null;
          age: number;
          birthday: string | null;
          class: string | null;
          school: string | null;
          school_schedule: string | null;
          interests: string[] | null;
          learning_style: string | null;
          special_needs: string | null;
          archived: boolean | null;
          points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          nickname?: string | null;
          picture?: string | null;
          avatar?: string | null;
          age: number;
          birthday?: string | null;
          class?: string | null;
          school?: string | null;
          school_schedule?: string | null;
          interests?: string[] | null;
          learning_style?: string | null;
          special_needs?: string | null;
          archived?: boolean | null;
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          nickname?: string | null;
          picture?: string | null;
          avatar?: string | null;
          age?: number;
          birthday?: string | null;
          class?: string | null;
          school?: string | null;
          school_schedule?: string | null;
          interests?: string[] | null;
          learning_style?: string | null;
          special_needs?: string | null;
          archived?: boolean | null;
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      parent_profiles: {
        Row: {
          parent_id: string;
          name: string | null;
          avatar_url: string | null;
          timezone: string | null;
          language: string | null;
          role: string | null;
          tone: string | null;
          goal: string | null;
          preferences: Json | null;
          notifications: Json | null;
          privacy: Json | null;
          updated_at: string | null;
        };
        Insert: {
          parent_id: string;
          name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          language?: string | null;
          role?: string | null;
          tone?: string | null;
          goal?: string | null;
          preferences?: Json | null;
          notifications?: Json | null;
          privacy?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          parent_id?: string;
          name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          language?: string | null;
          role?: string | null;
          tone?: string | null;
          goal?: string | null;
          preferences?: Json | null;
          notifications?: Json | null;
          privacy?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      parent_routines: {
        Row: {
          id: string;
          parent_id: string;
          type: string;
          title: string;
          steps: string[] | null;
          reminder_time: string | null;
          reminder_enabled: boolean | null;
          streak: number | null;
          last_completed_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          parent_id: string;
          type: string;
          title: string;
          steps?: string[] | null;
          reminder_time?: string | null;
          reminder_enabled?: boolean | null;
          streak?: number | null;
          last_completed_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          parent_id?: string;
          type?: string;
          title?: string;
          steps?: string[] | null;
          reminder_time?: string | null;
          reminder_enabled?: boolean | null;
          streak?: number | null;
          last_completed_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      parent_goals: {
        Row: {
          id: string;
          parent_id: string;
          title: string;
          description: string | null;
          target_days: number | null;
          current_streak: number | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          parent_id: string;
          title: string;
          description?: string | null;
          target_days?: number | null;
          current_streak?: number | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          parent_id?: string;
          title?: string;
          description?: string | null;
          target_days?: number | null;
          current_streak?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          child_id: string;
          title: string;
          description: string | null;
          type: TaskType;
          category: string;
          points: number;
          negative_points: number;
          status: TaskStatus;
          due_date: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          title: string;
          description?: string | null;
          type: TaskType;
          category: string;
          points: number;
          negative_points: number;
          status?: TaskStatus;
          due_date?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          child_id?: string;
          title?: string;
          description?: string | null;
          type?: TaskType;
          category?: string;
          points?: number;
          negative_points?: number;
          status?: TaskStatus;
          due_date?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          id: string;
          child_id: string | null;
          title: string;
          description: string | null;
          image_url: string | null;
          points_required: number;
          redeemed: boolean;
          redeemed_by_child_id: string | null;
          date_earned: string | null;
          created_at: string;
          redeemed_at: string | null;
        };
        Insert: {
          id?: string;
          child_id?: string | null;
          title: string;
          description?: string | null;
          image_url?: string | null;
          points_required: number;
          redeemed?: boolean;
          redeemed_by_child_id?: string | null;
          date_earned?: string | null;
          created_at?: string;
          redeemed_at?: string | null;
        };
        Update: {
          id?: string;
          child_id?: string | null;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          points_required?: number;
          redeemed?: boolean;
          redeemed_by_child_id?: string | null;
          date_earned?: string | null;
          created_at?: string;
          redeemed_at?: string | null;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          child_id: string;
          subject: string;
          questions: Json;
          points_per_question: number;
          completed: boolean;
          marked: boolean;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          subject: string;
          questions: Json;
          points_per_question: number;
          completed?: boolean;
          marked?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          child_id?: string;
          subject?: string;
          questions?: Json;
          points_per_question?: number;
          completed?: boolean;
          marked?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          child_id: string;
          date: string;
          tasks_completed: number;
          points_earned: number;
          rewards_redeemed: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          date: string;
          tasks_completed: number;
          points_earned: number;
          rewards_redeemed: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          date?: string;
          tasks_completed?: number;
          points_earned?: number;
          rewards_redeemed?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_template_versions: {
        Row: {
          id: string;
          template_id: string;
          version: number;
          html_content: string | null;
          plain_text: string | null;
          subject: string;
          editor_email: string;
          editor_name: string | null;
          changelog: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          version?: number;
          html_content?: string | null;
          plain_text?: string | null;
          subject: string;
          editor_email: string;
          editor_name?: string | null;
          changelog?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          version?: number;
          html_content?: string | null;
          plain_text?: string | null;
          subject?: string;
          editor_email?: string;
          editor_name?: string | null;
          changelog?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      email_schedules: {
        Row: {
          id: string;
          template_id: string;
          scheduled_at: string;
          timezone: string | null;
          status: string | null;
          recipient_count: number | null;
          sent_count: number | null;
          failed_count: number | null;
          segment_filters: Json | null;
          created_by: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          scheduled_at: string;
          timezone?: string | null;
          status?: string | null;
          recipient_count?: number | null;
          sent_count?: number | null;
          failed_count?: number | null;
          segment_filters?: Json | null;
          created_by: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          scheduled_at?: string;
          timezone?: string | null;
          status?: string | null;
          recipient_count?: number | null;
          sent_count?: number | null;
          failed_count?: number | null;
          segment_filters?: Json | null;
          created_by?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      email_audience_segments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          filters: Json;
          estimated_count: number | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          filters?: Json;
          estimated_count?: number | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          filters?: Json;
          estimated_count?: number | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      email_delivery_records: {
        Row: {
          id: string;
          template_id: string;
          template_version: number | null;
          schedule_id: string | null;
          recipient_email: string;
          recipient_id: string | null;
          status: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          bounced_at: string | null;
          failed_at: string | null;
          error_message: string | null;
          retry_count: number | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          template_version?: number | null;
          schedule_id?: string | null;
          recipient_email: string;
          recipient_id?: string | null;
          status?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          bounced_at?: string | null;
          failed_at?: string | null;
          error_message?: string | null;
          retry_count?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          template_version?: number | null;
          schedule_id?: string | null;
          recipient_email?: string;
          recipient_id?: string | null;
          status?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          bounced_at?: string | null;
          failed_at?: string | null;
          error_message?: string | null;
          retry_count?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      email_system_config: {
        Row: {
          id: string;
          global_kill_switch: boolean | null;
          kill_switch_enabled_at: string | null;
          kill_switch_enabled_by: string | null;
          default_from_name: string | null;
          default_from_email: string | null;
          default_reply_to: string | null;
          quiet_hours: Json | null;
          throttle: Json | null;
          retry_config: Json | null;
          unsubscribe_url: string | null;
          company_address: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          global_kill_switch?: boolean | null;
          kill_switch_enabled_at?: string | null;
          kill_switch_enabled_by?: string | null;
          default_from_name?: string | null;
          default_from_email?: string | null;
          default_reply_to?: string | null;
          quiet_hours?: Json | null;
          throttle?: Json | null;
          retry_config?: Json | null;
          unsubscribe_url?: string | null;
          company_address?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          global_kill_switch?: boolean | null;
          kill_switch_enabled_at?: string | null;
          kill_switch_enabled_by?: string | null;
          default_from_name?: string | null;
          default_from_email?: string | null;
          default_reply_to?: string | null;
          quiet_hours?: Json | null;
          throttle?: Json | null;
          retry_config?: Json | null;
          unsubscribe_url?: string | null;
          company_address?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      email_compliance_records: {
        Row: {
          id: string;
          type: string;
          user_email: string;
          user_id: string | null;
          status: string | null;
          requested_at: string | null;
          processed_at: string | null;
          processed_by: string | null;
          metadata: Json | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          type: string;
          user_email: string;
          user_id?: string | null;
          status?: string | null;
          requested_at?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          metadata?: Json | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          type?: string;
          user_email?: string;
          user_id?: string | null;
          status?: string | null;
          requested_at?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          metadata?: Json | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      email_blocks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: string;
          html_template: string;
          preview_image: string | null;
          variables: string[] | null;
          is_system: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: string;
          html_template: string;
          preview_image?: string | null;
          variables?: string[] | null;
          is_system?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: string;
          html_template?: string;
          preview_image?: string | null;
          variables?: string[] | null;
          is_system?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      email_dry_runs: {
        Row: {
          id: string;
          template_id: string;
          template_name: string | null;
          executed_by: string;
          segment_filters: Json | null;
          total_recipients: number | null;
          recipients: Json | null;
          estimated_send_time: string | null;
          warnings: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          template_name?: string | null;
          executed_by: string;
          segment_filters?: Json | null;
          total_recipients?: number | null;
          recipients?: Json | null;
          estimated_send_time?: string | null;
          warnings?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          template_name?: string | null;
          executed_by?: string;
          segment_filters?: Json | null;
          total_recipients?: number | null;
          recipients?: Json | null;
          estimated_send_time?: string | null;
          warnings?: string[] | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      email_unsubscribes: {
        Row: {
          id: string;
          email: string;
          user_id: string | null;
          reason: string | null;
          unsubscribed_at: string | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          user_id?: string | null;
          reason?: string | null;
          unsubscribed_at?: string | null;
          source?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          user_id?: string | null;
          reason?: string | null;
          unsubscribed_at?: string | null;
          source?: string | null;
        };
        Relationships: [];
      };
      email_analytics_daily: {
        Row: {
          id: string;
          template_id: string;
          date: string;
          total_sent: number | null;
          total_delivered: number | null;
          total_opened: number | null;
          total_clicked: number | null;
          total_bounced: number | null;
          total_failed: number | null;
          total_unsubscribed: number | null;
          open_rate: number | null;
          click_rate: number | null;
          bounce_rate: number | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          date: string;
          total_sent?: number | null;
          total_delivered?: number | null;
          total_opened?: number | null;
          total_clicked?: number | null;
          total_bounced?: number | null;
          total_failed?: number | null;
          total_unsubscribed?: number | null;
          open_rate?: number | null;
          click_rate?: number | null;
          bounce_rate?: number | null;
        };
        Update: {
          id?: string;
          template_id?: string;
          date?: string;
          total_sent?: number | null;
          total_delivered?: number | null;
          total_opened?: number | null;
          total_clicked?: number | null;
          total_bounced?: number | null;
          total_failed?: number | null;
          total_unsubscribed?: number | null;
          open_rate?: number | null;
          click_rate?: number | null;
          bounce_rate?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      task_type: TaskType;
      task_status: TaskStatus;
      subscription_tier: SubscriptionTier;
      theme_type: ThemeType;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Parent = Tables<'parents'>;
export type Child = Tables<'children'>;
export type Task = Tables<'tasks'>;
export type Reward = Tables<'rewards'>;
export type Exercise = Tables<'exercises'>;
export type Report = Tables<'reports'>;

// Environment variables for Vite
declare const import_meta_env: {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

// Get environment variables (works in both Vite and Node)
const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && (window as unknown as { __env?: Record<string, string> }).__env) {
    return (window as unknown as { __env: Record<string, string> }).__env[key] || '';
  }
  // Fallback for Vite
  try {
    return import.meta.env?.[key] || '';
  } catch {
    return '';
  }
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');
const FALLBACK_SUPABASE_URL = 'http://localhost';
const FALLBACK_SUPABASE_KEY = 'public-anon-key';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Create Supabase client for admin dashboard
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL || FALLBACK_SUPABASE_URL,
  SUPABASE_ANON_KEY || FALLBACK_SUPABASE_KEY,
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}
);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Helper to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return user;
};

// Helper to check if user is admin
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const { data: parent, error } = await supabase
    .from('parents')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (error || !parent) return false;
  const role = (parent as { role: UserRole }).role;
  return role === 'admin' || role === 'superadmin';
};

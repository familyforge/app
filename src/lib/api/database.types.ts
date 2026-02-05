// Pro Parenting App - Supabase Database Types
// Auto-generated types matching the database schema

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
          type?: TaskType;
          category?: string;
          points?: number;
          negative_points?: number;
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
          questions?: Json;
          points_per_question?: number;
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
          tasks_completed?: number;
          points_earned?: number;
          rewards_redeemed?: number;
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
      };
      settings: {
        Row: {
          id: string;
          parent_id: string;
          theme: ThemeType;
          notifications: boolean;
          reminders: boolean;
          points_to_money_rate: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          theme?: ThemeType;
          notifications?: boolean;
          reminders?: boolean;
          points_to_money_rate?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          theme?: ThemeType;
          notifications?: boolean;
          reminders?: boolean;
          points_to_money_rate?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_queue: {
        Row: {
          id: string;
          parent_id: string;
          operation: string;
          table_name: string;
          record_id: string;
          data: Json;
          synced: boolean;
          created_at: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          parent_id: string;
          operation: string;
          table_name: string;
          record_id: string;
          data: Json;
          synced?: boolean;
          created_at?: string;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          parent_id?: string;
          operation?: string;
          table_name?: string;
          record_id?: string;
          data?: Json;
          synced?: boolean;
          created_at?: string;
          synced_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_child_stats: {
        Args: { child_uuid: string };
        Returns: {
          total_tasks: number;
          completed_tasks: number;
          total_points: number;
          rewards_redeemed: number;
        };
      };
      get_parent_analytics: {
        Args: { parent_uuid: string };
        Returns: {
          total_children: number;
          total_tasks_completed: number;
          total_points_earned: number;
          total_rewards_redeemed: number;
          completion_rate: number;
        };
      };
    };
    Enums: {
      task_type: TaskType;
      task_status: TaskStatus;
      subscription_tier: SubscriptionTier;
      theme_type: ThemeType;
      user_role: UserRole;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Parent = Tables<'parents'>;
export type Child = Tables<'children'>;
export type Task = Tables<'tasks'>;
export type Reward = Tables<'rewards'>;
export type Exercise = Tables<'exercises'>;
export type Report = Tables<'reports'>;
export type Settings = Tables<'settings'>;
export type SyncQueueItem = Tables<'sync_queue'>;

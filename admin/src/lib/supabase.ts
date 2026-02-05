// Pro Parenting Admin Dashboard - Supabase Client Configuration
// This file initializes the Supabase client for the web admin dashboard

import { createClient } from '@supabase/supabase-js';

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
          password_hash: string;
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
    // @ts-expect-error - Vite injects import.meta.env at build time
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
export const supabase = createClient<Database>(
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

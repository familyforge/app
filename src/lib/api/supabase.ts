// Pro Parenting App - Supabase Client Configuration
// This file initializes the Supabase client for both mobile and admin apps

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Database } from './database.types';

// Environment variables - set these in your .env file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const SUPABASE_FALLBACK_URL = 'http://localhost';
const SUPABASE_FALLBACK_KEY = 'public-anon-key';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase credentials not found. Please add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

const isBrowser = typeof window !== 'undefined';

const webStorage = {
  getItem: (key: string) => {
    if (!isBrowser) return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser) return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (!isBrowser) return;
    window.localStorage.removeItem(key);
  },
};

const authStorage = isBrowser
  ? Platform.OS === 'web'
    ? webStorage
    : AsyncStorage
  : undefined;

// Create Supabase client with safe storage per platform
export const supabase = createClient<Database>(
  SUPABASE_URL || SUPABASE_FALLBACK_URL,
  SUPABASE_ANON_KEY || SUPABASE_FALLBACK_KEY,
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: isBrowser,
      persistSession: isBrowser,
      detectSessionInUrl: isBrowser && Platform.OS === 'web',
    },
});

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

// Re-export types
export type { Database };

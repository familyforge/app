// Pro Parenting App - API Helpers
// Shared utilities for API modules

import { supabase } from './supabase';

export async function requireAuthUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user.id;
}

export function throwIfSupabaseError(error: { message: string } | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

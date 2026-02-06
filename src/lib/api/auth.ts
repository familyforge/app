// Pro Parenting App - Authentication Service
// Handles parent/admin signup, login, logout, and session management

import { supabase } from './supabase';
import type { 
  SubscriptionTier, 
  UserRole,
  ThemeType,
} from './database.types';

// Parent profile type for internal use
interface ParentProfile {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  subscription_tier: SubscriptionTier;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Types
export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'admin' | 'superadmin';
  subscriptionTier: 'free' | 'premium';
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// ============================================
// PARENT AUTHENTICATION
// ============================================

/**
 * Sign up a new parent account
 * Creates both Supabase Auth user and parents table entry
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
        emailRedirectTo: undefined,
      },
    });

    console.log('[SignUp] Auth response:', {
      hasUser: !!authData?.user,
      hasSession: !!authData?.session,
      userId: authData?.user?.id,
      error: authError?.message,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    // Detect fake-success: Supabase returns user but no session when email
    // already exists (anti-enumeration). Check identities array.
    const identities = authData.user.identities ?? [];
    if (identities.length === 0) {
      console.warn('[SignUp] Fake success detected — email likely already registered');
      return { success: false, error: 'An account with this email already exists. Please use a different email or log in.' };
    }

    // 2. Create parent profile in parents table
    const parentData = {
      id: authData.user.id,
      email: data.email,
      name: data.name,
      password_hash: '', // Supabase Auth handles password hashing
      subscription_tier: 'free' as SubscriptionTier,
      plan_code: 'free',
      role: 'parent' as UserRole,
    };
    
    console.log('[SignUp] Inserting parent profile:', { id: parentData.id, email: parentData.email });
    const { error: profileError } = await supabase
      .from('parents')
      .insert(parentData as never);

    if (profileError) {
      console.error('[SignUp] Parents insert failed:', profileError.message, profileError.code);
      // Rollback: sign out since admin.deleteUser won't work from client
      await supabase.auth.signOut().catch(() => {});
      return { success: false, error: profileError.message };
    }
    console.log('[SignUp] Parent profile created successfully');

    // 3. Create default settings for the parent
    const settingsData = {
      parent_id: authData.user.id,
      theme: 'dark' as ThemeType,
      notifications: true,
      reminders: true,
      points_to_money_rate: 0.01,
      currency: 'GBP',
    };
    
    await supabase
      .from('settings')
      .insert(settingsData as never);

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: 'parent',
        subscriptionTier: 'free',
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Sign in an existing parent
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to sign in' };
    }

    // Fetch parent profile
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (parentError || !parentData) {
      return { success: false, error: 'Parent profile not found' };
    }

    const parent = parentData as unknown as ParentProfile;

    return {
      success: true,
      user: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        role: parent.role,
        subscriptionTier: parent.subscription_tier,
        createdAt: parent.created_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// ============================================
// ADMIN AUTHENTICATION
// ============================================

/**
 * Sign in as admin (requires admin or superadmin role)
 */
export async function signInAsAdmin(data: SignInData): Promise<AuthResult> {
  try {
    // First, sign in normally
    const result = await signIn(data);

    if (!result.success || !result.user) {
      return result;
    }

    // Check if user has admin privileges
    if (result.user.role !== 'admin' && result.user.role !== 'superadmin') {
      // Sign out if not an admin
      await signOut();
      return { success: false, error: 'Access denied. Admin privileges required.' };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get the current authenticated user
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch parent profile
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .select('*')
      .eq('id', user.id)
      .single();

    if (parentError || !parentData) {
      return null;
    }

    const parent = parentData as unknown as ParentProfile;

    return {
      id: parent.id,
      email: parent.email,
      name: parent.name,
      role: parent.role,
      subscriptionTier: parent.subscription_tier,
      createdAt: parent.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentAuthUser();
  return user?.role === 'admin' || user?.role === 'superadmin';
}

/**
 * Get the current session token (JWT)
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Refresh the session token
 */
export async function refreshSession(): Promise<boolean> {
  const { error } = await supabase.auth.refreshSession();
  return !error;
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Update password (requires user to be authenticated)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * Update parent profile
 */
export async function updateProfile(
  updates: { name?: string; email?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update auth email if changed
    if (updates.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: updates.email,
      });
      if (authError) {
        return { success: false, error: authError.message };
      }
    }

    // Update parent profile
    const updateData = {
      ...(updates.name && { name: updates.name }),
      ...(updates.email && { email: updates.email }),
    };
    
    const { error: profileError } = await supabase
      .from('parents')
      .update(updateData as never)
      .eq('id', user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// ============================================
// AUTH STATE LISTENER
// ============================================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, user: AuthUser | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentAuthUser();
      callback(event, user);
    } else {
      callback(event, null);
    }
  });

  return () => subscription.unsubscribe();
}

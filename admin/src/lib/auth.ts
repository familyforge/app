// Pro Parenting Admin Dashboard - Authentication Service
// Admin-specific auth with role verification

import { supabase, type UserRole, type SubscriptionTier } from './supabase';

// Internal type for parent profile
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
export interface AdminSignInData {
  email: string;
  password: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AdminAuthResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

/**
 * Sign in as admin (requires admin or superadmin role)
 */
export async function adminSignIn(data: AdminSignInData): Promise<AdminAuthResult> {
  try {
    // Sign in with Supabase Auth
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

    // Fetch parent profile and verify admin role
    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (parentError || !parentData) {
      await supabase.auth.signOut();
      return { success: false, error: 'User profile not found' };
    }

    const parent = parentData as unknown as ParentProfile;

    // Check role
    if (parent.role !== 'admin' && parent.role !== 'superadmin') {
      await supabase.auth.signOut();
      return { success: false, error: 'Access denied. Admin privileges required.' };
    }

    return {
      success: true,
      user: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
        role: parent.role,
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
 * Sign out admin
 */
export async function adminSignOut(): Promise<{ success: boolean; error?: string }> {
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

/**
 * Get current admin user
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const { data: parentData, error: parentError } = await supabase
      .from('parents')
      .select('*')
      .eq('id', user.id)
      .single();

    if (parentError || !parentData) {
      return null;
    }

    const parent = parentData as unknown as ParentProfile;
    
    if (parent.role !== 'admin' && parent.role !== 'superadmin') {
      return null;
    }

    return {
      id: parent.id,
      email: parent.email,
      name: parent.name,
      role: parent.role,
      createdAt: parent.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Check if current user is admin
 */
export async function verifyAdminAccess(): Promise<boolean> {
  const admin = await getCurrentAdminUser();
  return admin !== null;
}

/**
 * Get access token for API calls
 */
export async function getAdminAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Subscribe to admin auth state changes
 */
export function onAdminAuthStateChange(
  callback: (user: AdminUser | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const admin = await getCurrentAdminUser();
      callback(admin);
    } else {
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
}

/**
 * Create a new admin user (superadmin only)
 */
export async function createAdminUser(
  data: { email: string; password: string; name: string },
  role: 'admin' | 'superadmin' = 'admin'
): Promise<AdminAuthResult> {
  try {
    // Verify current user is superadmin
    const currentAdmin = await getCurrentAdminUser();
    if (!currentAdmin || currentAdmin.role !== 'superadmin') {
      return { success: false, error: 'Only superadmins can create admin users' };
    }

    // Create auth user (this would typically be done via Supabase Admin API)
    // For security, this should be done server-side
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create admin user' };
    }

    // Create parent profile with admin role
    const parentData = {
      id: authData.user.id,
      email: data.email,
      name: data.name,
      password_hash: '',
      subscription_tier: 'premium' as SubscriptionTier,
      role: role as UserRole,
    };
    
    const { error: profileError } = await supabase
      .from('parents')
      .insert(parentData as never);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: role,
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
 * Update admin user role (superadmin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentAdmin = await getCurrentAdminUser();
    if (!currentAdmin || currentAdmin.role !== 'superadmin') {
      return { success: false, error: 'Only superadmins can update user roles' };
    }

    const { error } = await supabase
      .from('parents')
      .update({ role: newRole } as never)
      .eq('id', userId);

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
